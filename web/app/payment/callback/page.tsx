'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference');
        const trxref = searchParams.get('trxref');
        
        // Use reference from URL params (Paystack sends this)
        const paymentReference = reference || trxref;
        
        if (!paymentReference) {
          setStatus('error');
          setMessage('Payment reference not found');
          return;
        }

        // Verify payment with backend
        const response = await api.post('/payments/verify/', {
          reference: paymentReference
        });

        if (response.data.status === 'success') {
          setStatus('success');
          setMessage('Payment verified successfully!');
          toast.success('Payment completed successfully!');
          
          // Redirect to appropriate page after 3 seconds
          setTimeout(() => {
            if (response.data.order_id) {
              router.push('/my-orders');
            } else if (response.data.job_id) {
              router.push('/my-jobs');
            } else {
              router.push('/transactions');
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Payment verification failed');
          toast.error('Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.error || 'Payment verification failed');
        toast.error('Payment verification failed');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  const handleReturnHome = () => {
    router.push('/dashboard');
  };

  const handleViewTransactions = () => {
    router.push('/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
                <p className="text-gray-600">Please wait while we confirm your payment...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <p className="text-sm text-gray-500 mb-6">You will be redirected automatically in a few seconds...</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleViewTransactions}
                    className="btn-secondary"
                  >
                    View Transactions
                  </button>
                  <button
                    onClick={handleReturnHome}
                    className="btn-primary"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-red-900 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleViewTransactions}
                    className="btn-secondary"
                  >
                    View Transactions
                  </button>
                  <button
                    onClick={handleReturnHome}
                    className="btn-primary"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
