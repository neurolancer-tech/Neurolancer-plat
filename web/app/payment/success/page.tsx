'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    toast.success('Payment completed successfully!');
    
    // Redirect to transactions page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/transactions');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleViewTransactions = () => {
    router.push('/transactions');
  };

  const handleReturnHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. You will be redirected to your transactions page shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">Redirecting in 3 seconds...</p>
            
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
          </div>
        </div>
      </main>
    </div>
  );
}