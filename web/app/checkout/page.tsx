'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { convertUSDToKES } from '@/utils/currency';

interface PaymentDetails {
  amount?: string;
  project?: string;
  freelancer?: string;
  order?: string;
  job_id?: string;
  freelancer_id?: string;
  hours_worked?: string;
  hourly_rate?: string;
  payment_type?: string;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [calculatingFees, setCalculatingFees] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    project: '',
    freelancer: '',
    order: '',
    job_id: '',
    freelancer_id: '',
    hours_worked: '',
    hourly_rate: '',
    payment_type: 'gig'
  });
  const [feeBreakdown, setFeeBreakdown] = useState({
    base_amount: 0,
    platform_fee: 0,
    platform_fee_percentage: 5,
    processing_fee: 50,
    total_amount: 0,
    currency: 'KES'
  });
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [mobileMoneyProviders, setMobileMoneyProviders] = useState([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    if (initialized.current) return; // Prevent multiple executions
    initialized.current = true;

    // Try to get payment details from sessionStorage first, then URL params
    const checkoutData = sessionStorage.getItem('checkoutData');
    let paymentDetails: PaymentDetails = {};
    
    if (checkoutData) {
      try {
        const data = JSON.parse(checkoutData);
        console.log('Checkout data from sessionStorage:', data);
        if (data.type === 'payment_request') {
          paymentDetails = {
            amount: data.amount ? data.amount.toString() : '',
            project: data.title || 'Payment Request',
            freelancer: data.freelancer_name || 'Unknown',
            order: '',
            job_id: data.request_id ? data.request_id.toString() : '',
            freelancer_id: '1',
            hours_worked: '',
            hourly_rate: '',
            payment_type: 'job'
          };
          console.log('Mapped payment details:', paymentDetails);
        }
        // Clear the data after use
        sessionStorage.removeItem('checkoutData');
      } catch (error) {
        console.error('Error parsing checkout data:', error);
      }
    }
    
    // Fallback to URL params if no sessionStorage data
    if (!paymentDetails.amount) {
      const amount = searchParams.get('amount') || '';
      const project = searchParams.get('project') || 'Task Payment';
      const freelancer = searchParams.get('freelancer') || 'Freelancer';
      const order = searchParams.get('orderId') || searchParams.get('order') || '';
      const job_id = searchParams.get('job_id') || '';
      const freelancer_id = searchParams.get('freelancer_id') || '';
      const hours_worked = searchParams.get('hours_worked') || '';
      const hourly_rate = searchParams.get('hourly_rate') || '';
      const payment_type = searchParams.get('type') || searchParams.get('payment_type') || 'gig';
      
      paymentDetails = { 
        amount, 
        project, 
        freelancer, 
        order, 
        job_id, 
        freelancer_id, 
        hours_worked, 
        hourly_rate, 
        payment_type 
      };
    }

    console.log('Payment details:', paymentDetails);
    
    if (!paymentDetails.amount && !(paymentDetails.hours_worked && paymentDetails.hourly_rate)) {
      console.log('Validation failed - no amount or hourly details');
      toast.error('Invalid payment details');
      router.push('/transactions');
      return;
    }

    setPaymentData({
      amount: paymentDetails.amount || '',
      project: paymentDetails.project || '',
      freelancer: paymentDetails.freelancer || '',
      order: paymentDetails.order || '',
      job_id: paymentDetails.job_id || '',
      freelancer_id: paymentDetails.freelancer_id || '',
      hours_worked: paymentDetails.hours_worked || '',
      hourly_rate: paymentDetails.hourly_rate || '',
      payment_type: paymentDetails.payment_type || 'gig'
    });

    // Calculate fees
    calculateFees(paymentDetails.amount || '', paymentDetails.hours_worked || '', paymentDetails.hourly_rate || '');
    
    // Load mobile money providers
    loadMobileMoneyProviders();
  }, [router, searchParams]);

  const calculateFees = async (amount: string, hours_worked: string, hourly_rate: string) => {
    setCalculatingFees(true);
    try {
      const response = await api.post('/payments/calculate-fees/', {
        amount: amount || null,
        hours_worked: hours_worked || null,
        hourly_rate: hourly_rate || null
      });
      
      if (response.data.status === 'success') {
        // Convert USD amounts to KES
        const breakdown = response.data.breakdown;
        const convertedBreakdown = {
          base_amount: await convertUSDToKES(breakdown.base_amount),
          platform_fee: await convertUSDToKES(breakdown.platform_fee),
          platform_fee_percentage: breakdown.platform_fee_percentage,
          processing_fee: await convertUSDToKES(breakdown.processing_fee),
          total_amount: await convertUSDToKES(breakdown.total_amount),
          currency: 'KES'
        };
        setFeeBreakdown(convertedBreakdown);
      }
    } catch (error) {
      console.error('Fee calculation error:', error);
      // Fallback calculation with KES conversion
      const baseAmountUSD = hours_worked && hourly_rate 
        ? parseFloat(hours_worked) * parseFloat(hourly_rate)
        : parseFloat(amount || '0');
      const platformFeeUSD = baseAmountUSD * 0.05;
      const processingFeeUSD = 2; // $2 processing fee
      
      setFeeBreakdown({
        base_amount: await convertUSDToKES(baseAmountUSD),
        platform_fee: await convertUSDToKES(platformFeeUSD),
        platform_fee_percentage: 5,
        processing_fee: await convertUSDToKES(processingFeeUSD),
        total_amount: await convertUSDToKES(baseAmountUSD + platformFeeUSD + processingFeeUSD),
        currency: 'KES'
      });
    } finally {
      setCalculatingFees(false);
    }
  };

  const loadMobileMoneyProviders = async () => {
    try {
      const response = await api.get('/payments/mobile-money/');
      if (response.data.status === 'success') {
        setMobileMoneyProviders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load mobile money providers:', error);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      if (paymentMethod === 'paystack') {
        await processPaystackPayment();
      } else {
        // Initialize payment with backend for card payments
        const paymentPayload = {
          payment_type: paymentData.payment_type,
          ...(paymentData.order && { order_id: paymentData.order }),
          ...(paymentData.job_id && { 
            job_id: paymentData.job_id,
            freelancer_id: paymentData.freelancer_id,
            amount: paymentData.amount
          }),
          ...(paymentData.hours_worked && paymentData.hourly_rate && {
            hours_worked: paymentData.hours_worked,
            hourly_rate: paymentData.hourly_rate
          })
        };

        const response = await api.post('/payments/initialize/', paymentPayload);
        
        if (response.data.status === 'success') {
          const { authorization_url } = response.data.data;
          window.location.href = authorization_url;
        } else {
          throw new Error(response.data.error || 'Payment initialization failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error((error as any).response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPaystackPayment = async () => {
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) {
      toast.error('Paystack not loaded. Please refresh the page.');
      return;
    }

    const handler = PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: getCurrentUserEmail(),
      amount: Math.round(feeBreakdown.total_amount * 100), // Convert to cents
      currency: 'KES',
      ref: `neurolancer_${Date.now()}`,
      callback: function(response: any) {
        toast.success('Payment successful!');
        recordTransaction(response.reference, feeBreakdown.total_amount);
      },
      onClose: function() {
        toast('Payment cancelled');
      }
    });
    
    handler.openIframe();
  };

  const getCurrentUserEmail = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.email || 'test@example.com';
    }
    return 'test@example.com';
  };

  const recordTransaction = async (reference: string, amount: number) => {
    try {
      // For task payments, complete the order after successful payment
      const orderId = searchParams.get('orderId');
      const paymentType = searchParams.get('type');
      
      if (orderId && paymentType === 'task_payment') {
        // Update order status to completed for task payments
        await api.post(`/orders/${orderId}/update-status/`, { 
          status: 'completed',
          message: 'Payment completed successfully' 
        });
        toast.success('Payment completed! Freelancer has been paid.');
        router.push('/projects');
      } else {
        // Handle other payment types
        const response = await api.post('/payments/record-transaction/', {
          reference,
          amount,
          project: paymentData.project,
          freelancer: paymentData.freelancer
        });
        
        if (response.data.status === 'success') {
          router.push('/my-jobs');
        }
      }
    } catch (error) {
      console.error('Transaction recording error:', error);
      toast.error('Payment successful but status update failed');
      router.push('/projects'); // Still redirect on success
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Complete Payment</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Secure payment for your completed project</p>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Summary</h3>
              
              {calculatingFees ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Project:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{paymentData.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Freelancer:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{paymentData.freelancer}</span>
                  </div>
                  
                  {paymentData.hours_worked && paymentData.hourly_rate && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hours Worked:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{paymentData.hours_worked} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">KES {paymentData.hourly_rate}/hr</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">KES {feeBreakdown.base_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform Fee ({feeBreakdown.platform_fee_percentage}%):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">KES {feeBreakdown.platform_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">KES {feeBreakdown.processing_fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-gray-100">Total Amount:</span>
                      <span className="text-primary">KES {feeBreakdown.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Method</h3>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary bg-white dark:bg-gray-700">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="paystack" 
                    checked={paymentMethod === 'paystack'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only" 
                  />
                  <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                    paymentMethod === 'paystack' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'paystack' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-8 h-8 mr-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-400">Paystack</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Card, Bank Transfer, M-Pesa</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Paystack Payment</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Paystack Payment Options</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Pay securely with Card, Bank Transfer, or M-Pesa. Total: KES {feeBreakdown.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Secure Payment with Paystack</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Payments are processed securely through Paystack. Your payment information is encrypted and protected with industry-standard security.
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    • {feeBreakdown.client_fee_percentage}% platform fee from your payment<br/>
                    • {feeBreakdown.freelancer_fee_percentage}% additional fee deducted from freelancer earnings<br/>
                    • Processing fee covers transaction costs
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Link
                href="/my-jobs"
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </Link>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {paymentMethod === 'paystack' ? 'Pay with Paystack' : `Pay KES ${feeBreakdown.total_amount.toLocaleString()}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}