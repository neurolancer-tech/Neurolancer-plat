'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PaymentRequest {
  id: number;
  freelancer_name: string;
  amount: number;
  description: string;
  proposal_id: number;
  job_title: string;
  created_at: string;
  status: 'pending' | 'paid' | 'rejected';
}

interface Transaction {
  id: number;
  type: 'payment' | 'withdrawal' | 'refund' | 'fee';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [payingRequest, setPayingRequest] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Load transactions
      const transactionsResponse = await api.get('/orders/');
      const orders = transactionsResponse.data.results || transactionsResponse.data;
      
      // Convert orders to transactions
      const transactionData = orders.map((order: any) => ({
        id: order.id,
        type: 'payment',
        amount: order.price,
        description: `Payment for: ${order.title}`,
        status: order.status === 'completed' ? 'completed' : 'pending',
        created_at: order.created_at,
        reference: `ORD-${order.id}`
      }));
      
      setTransactions(transactionData);
      
      // Load payment requests from notifications
      const notificationsResponse = await api.get('/notifications/');
      const notifications = notificationsResponse.data.results || notificationsResponse.data;
      
      // Filter payment request notifications
      const paymentRequestData = notifications
        .filter((notif: any) => notif.notification_type === 'payment' && notif.message.includes('Payment request'))
        .map((notif: any) => {
          const amountMatch = notif.message.match(/\$(\d+(?:\.\d{2})?)/); 
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
          
          return {
            id: notif.id,
            freelancer_name: notif.message.split(' from ')[1]?.split('.')[0] || 'Unknown',
            amount: amount,
            description: notif.message,
            proposal_id: notif.related_object_id || 0,
            job_title: notif.title.replace('Payment Request: ', ''),
            created_at: notif.created_at,
            status: 'pending' as const
          };
        });
      
      setPaymentRequests(paymentRequestData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePayRequest = async (request: PaymentRequest) => {
    setPayingRequest(request.id);
    try {
      // Navigate to checkout page with payment request data
      const checkoutData = {
        type: 'payment_request',
        amount: request.amount,
        title: request.job_title,
        description: request.description,
        freelancer_name: request.freelancer_name,
        request_id: request.id
      };
      
      // Store checkout data in sessionStorage
      console.log('Storing checkout data:', checkoutData);
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      // Navigate to checkout page
      router.push('/checkout');
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setPayingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">View your transaction history</p>
        </div>

        {/* Tabs */}
        <div className="card rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Payment Requests ({paymentRequests.length})
            </button>
          </div>
        </div>

        {/* Payment Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {paymentRequests.length === 0 ? (
              <div className="card rounded-lg shadow-sm border p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Payment Requests</h3>
                <p className="text-gray-600 dark:text-gray-400">You don&apos;t have any pending payment requests.</p>
              </div>
            ) : (
              paymentRequests.map(request => (
                <div key={request.id} className="card rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{request.job_title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">From: {request.freelancer_name}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Amount: KES {request.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handlePayRequest(request)}
                          disabled={payingRequest === request.id}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {payingRequest === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                              </svg>
                              <span>Pay Now</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Paid</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Transactions Tab */}
        {activeTab === 'all' && (
          <div className="card rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>
            </div>
            <div className="divide-y">
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Transactions</h3>
                  <p className="text-gray-600 dark:text-gray-400">Your transaction history will appear here.</p>
                </div>
              ) : (
                transactions.map(transaction => (
                  <div key={transaction.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'payment' ? 'bg-green-100' :
                        transaction.type === 'withdrawal' ? 'bg-blue-100' :
                        transaction.type === 'refund' ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          transaction.type === 'payment' ? 'text-green-600' :
                          transaction.type === 'withdrawal' ? 'text-blue-600' :
                          transaction.type === 'refund' ? 'text-yellow-600' :
                          'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{transaction.type}</span>
                          {transaction.reference && (
                            <>
                              <span>•</span>
                              <span>{transaction.reference}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        transaction.type === 'payment' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'payment' || transaction.type === 'refund' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}