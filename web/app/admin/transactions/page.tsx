'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';

interface Transaction {
  id: number;
  type: 'payment' | 'withdrawal' | 'refund' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  user: { username: string; first_name: string; last_name: string };
  order?: { id: number; gig: { title: string } };
  created_at: string;
  processed_at?: string;
  payment_method?: string;
  transaction_id?: string;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const user = getUser();
    if (user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }

    loadTransactions();
  }, [router]);

  const loadTransactions = async () => {
    try {
      // Generate mock transaction data
      const mockTransactions = [
        {
          id: 1,
          type: 'payment' as const,
          amount: 500.00,
          status: 'completed' as const,
          user: { username: 'client_john', first_name: 'John', last_name: 'Doe' },
          order: { id: 123, gig: { title: 'AI Chatbot Development' } },
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          processed_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          payment_method: 'Credit Card',
          transaction_id: 'TXN_001'
        },
        {
          id: 2,
          type: 'withdrawal' as const,
          amount: 450.00,
          status: 'pending' as const,
          user: { username: 'freelancer_sarah', first_name: 'Sarah', last_name: 'Smith' },
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          payment_method: 'Bank Transfer',
          transaction_id: 'TXN_002'
        },
        {
          id: 3,
          type: 'fee' as const,
          amount: 50.00,
          status: 'completed' as const,
          user: { username: 'system', first_name: 'System', last_name: 'Fee' },
          order: { id: 123, gig: { title: 'AI Chatbot Development' } },
          created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          processed_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
          transaction_id: 'TXN_003'
        },
        {
          id: 4,
          type: 'refund' as const,
          amount: 300.00,
          status: 'completed' as const,
          user: { username: 'client_mike', first_name: 'Mike', last_name: 'Johnson' },
          order: { id: 124, gig: { title: 'Data Analysis Project' } },
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          processed_at: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
          payment_method: 'Credit Card',
          transaction_id: 'TXN_004'
        },
        {
          id: 5,
          type: 'payment' as const,
          amount: 750.00,
          status: 'failed' as const,
          user: { username: 'client_anna', first_name: 'Anna', last_name: 'Wilson' },
          order: { id: 125, gig: { title: 'Machine Learning Model' } },
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          payment_method: 'Credit Card',
          transaction_id: 'TXN_005'
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: number, newStatus: string) => {
    try {
      // Mock API call
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: newStatus as any, processed_at: new Date().toISOString() }
            : t
        )
      );
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'withdrawal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'refund': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'fee': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.order?.gig.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + transactionsPerPage);

  const transactionStats = {
    total: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pending').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    revenue: transactions.filter(t => t.type === 'fee' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Transaction Management</h1>
          <p className="opacity-90">Monitor and manage all financial transactions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="payment">Payments</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="refund">Refunds</option>
              <option value="fee">Fees</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{transactionStats.total}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Transactions</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${transactionStats.totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Volume</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{transactionStats.pending}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${transactionStats.revenue.toFixed(2)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Platform Revenue</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.transaction_id}
                            </div>
                            {transaction.order && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                Order #{transaction.order.id}: {transaction.order.gig.title}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {transaction.user.first_name} {transaction.user.last_name}
                          <div className="text-xs text-gray-500 dark:text-gray-400">@{transaction.user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {transaction.status === 'pending' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => updateTransactionStatus(transaction.id, 'completed')}
                                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 rounded text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateTransactionStatus(transaction.id, 'failed')}
                                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}