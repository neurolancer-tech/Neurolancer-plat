'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Assessment {
  id: number;
  title: string;
  description: string;
  category: {
    name: string;
    icon: string;
  };
  difficulty_level: string;
  duration_minutes: number;
  passing_score: number;
  price: string;
  questions_count: number;
  user_attempts: number;
  best_score: number | null;
  has_paid: boolean;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [kesPrice, setKesPrice] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [userBalance, setUserBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadAssessment();
  }, [params.id]);

  const loadAssessment = async () => {
    try {
      const response = await api.get(`/assessments/${params.id}/`);
      const assessmentData = response.data;
      setAssessment(assessmentData);
      
      // Convert USD to KES
      const { convertUSDToKES } = await import('@/lib/currency');
      const converted = await convertUSDToKES(parseFloat(assessmentData.price));
      const fee = Math.round(converted * 0.10);
      const total = converted + fee;
      
      setKesPrice(converted);
      setProcessingFee(fee);
      setTotalAmount(total);
      
      // Load user balance
      loadUserBalance();
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
      router.push('/skill-assessments');
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      if (response.data.available_balance !== undefined) {
        // Convert USD to KES for display
        const { convertUSDToKES } = await import('@/lib/currency');
        const balanceInKes = await convertUSDToKES(parseFloat(response.data.available_balance));
        setUserBalance(balanceInKes);
      }
    } catch (error) {
      console.error('Failed to load user balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePurchase = async () => {
    if (!assessment) return;
    
    setPurchasing(true);
    try {
      if (paymentMethod === 'wallet') {
        await processWalletPayment();
      } else {
        await processPaystackPayment();
      }
    } catch (error: any) {
      console.error('Error purchasing assessment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const processWalletPayment = async () => {
    if (!assessment) return;
    
    if (userBalance < totalAmount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const response = await api.post('/payments/wallet-payment/', {
      payment_method: 'wallet',
      payment_type: 'assessment',
      assessment_id: assessment.id,
      amount: totalAmount
    });
    
    if (response.data.status === 'success') {
      toast.success('Payment completed successfully!');
      await createPaymentRecord(response.data.reference);
      setUserBalance(response.data.new_balance);
      setShowPaymentModal(false);
    } else {
      throw new Error(response.data.error || 'Wallet payment failed');
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
      amount: Math.round(totalAmount * 100),
      currency: 'KES',
      ref: `assessment_${assessment?.id}_${Date.now()}`,
      callback: function(response: any) {
        toast.success('Payment successful!');
        createPaymentRecord(response.reference);
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

  const createPaymentRecord = async (paymentReference: string) => {
    if (!assessment) return;
    
    try {
      await api.post('/assessments/payments/', {
        assessment: assessment.id,
        amount: assessment.price,
        payment_reference: paymentReference,
        status: 'completed'
      });
      
      setAssessment({ ...assessment, has_paid: true });
      toast.success('You can now take the assessment!');
    } catch (error) {
      console.error('Payment record error:', error);
      toast.error('Payment successful but failed to create record. Please contact support.');
    }
  };

  const handleStartAssessment = async () => {
    if (!assessment) return;
    
    try {
      const response = await api.post(`/assessments/${assessment.id}/start/`);
      
      if (response.data.attempt_id) {
        router.push(`/skill-assessments/${assessment.id}/take?attempt=${response.data.attempt_id}`);
      }
    } catch (error: any) {
      console.error('Error starting assessment:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to start assessment');
      }
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeLevel = (score: number) => {
    if (score >= 95) return { level: 'Platinum', color: 'bg-purple-100 text-purple-800' };
    if (score >= 85) return { level: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 75) return { level: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { level: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary hover:text-primary-dark mb-6"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Assessments
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-8">
            <div className="flex items-center mb-4">
              <i className={`${assessment.category.icon} text-3xl mr-4`}></i>
              <div>
                <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
                <div className="flex items-center space-x-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {assessment.category.name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(assessment.difficulty_level)} text-gray-800`}>
                    {assessment.difficulty_level.charAt(0).toUpperCase() + assessment.difficulty_level.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold">KES {totalAmount.toLocaleString()}</div>
          </div>

          <div className="p-8">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Assessment</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {assessment.description}
              </p>
            </div>

            {/* Assessment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <i className="fas fa-clock text-3xl text-primary mb-3"></i>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessment.duration_minutes}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Minutes</div>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <i className="fas fa-question-circle text-3xl text-primary mb-3"></i>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessment.questions_count}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <i className="fas fa-trophy text-3xl text-primary mb-3"></i>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessment.passing_score}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">Passing Score</div>
              </div>
            </div>

            {/* User Progress */}
            {assessment.user_attempts > 0 && (
              <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Your Progress
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Attempts: {assessment.user_attempts}
                    </span>
                  </div>
                  {assessment.best_score && (
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-700 dark:text-blue-300">Best Score:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeLevel(assessment.best_score).color}`}>
                        {assessment.best_score}% - {getBadgeLevel(assessment.best_score).level}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Be Tested On</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-600 dark:text-gray-400">Core concepts and fundamentals</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-600 dark:text-gray-400">Practical application scenarios</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-600 dark:text-gray-400">Best practices and methodologies</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-600 dark:text-gray-400">Industry-standard approaches</span>
                </div>
              </div>
            </div>

            {/* Badge Information */}
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                <i className="fas fa-medal mr-2"></i>
                Earn Your Skill Badge
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                Pass this assessment to earn a verified skill badge that will be displayed on your profile:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  70-74%: Bronze Badge
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  75-84%: Silver Badge
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  85-94%: Gold Badge
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  95-100%: Platinum Badge
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              {assessment.has_paid ? (
                <button
                  onClick={handleStartAssessment}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                >
                  <i className="fas fa-play mr-2"></i>
                  Start Assessment
                </button>
              ) : (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Purchase Assessment - KES {totalAmount.toLocaleString()}
                </button>
              )}
            </div>

            {/* Terms */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                By purchasing this assessment, you agree to our terms of service.
                You will have unlimited attempts to improve your score.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose Payment Method</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                {/* Wallet Payment */}
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  userBalance < totalAmount 
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary bg-white dark:bg-gray-700'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="wallet" 
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={userBalance < totalAmount}
                    className="sr-only" 
                  />
                  <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                    paymentMethod === 'wallet' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'wallet' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <i className="fas fa-wallet text-green-600 text-xl mr-3"></i>
                      <div>
                        <span className="font-medium text-green-700 dark:text-green-400">Wallet Balance</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {loadingBalance ? 'Loading...' : `Available: KES ${userBalance.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    {userBalance < totalAmount && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        Insufficient funds
                      </span>
                    )}
                  </div>
                </label>

                {/* Paystack Payment */}
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
                    <i className="fas fa-credit-card text-blue-600 text-xl mr-3"></i>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-400">Paystack</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Card, Bank Transfer, M-Pesa</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Assessment Price:</span>
                  <span className="font-medium">KES {kesPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                  <span className="font-medium">KES {processingFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    `Pay KES ${totalAmount.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}