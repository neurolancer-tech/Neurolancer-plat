'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import WithdrawalModal from '../../components/WithdrawalModal';
import api from '../../lib/api';

interface Withdrawal {
  id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

interface UserProfile {
  available_balance: number;
  total_earnings: number;
  available_balance_kes: number;
  total_earnings_kes: number;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profileRes = await api.get('/auth/profile/');
      setProfile(profileRes.data.profile);
      
      try {
        const withdrawalsRes = await api.get('/withdrawals/');
        const withdrawalsData = Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : withdrawalsRes.data.results || [];
        setWithdrawals(withdrawalsData);
      } catch (withdrawalError) {
        console.error('Error loading withdrawals:', withdrawalError);
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };



  const handleWithdrawalSuccess = () => {
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
      <Navigation />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Withdrawals</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your earnings and withdrawal requests</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Minimum withdrawal: 100 KES • Powered by Paystack
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              {profile?.available_balance_kes && profile.available_balance_kes < 100 ? (
                <div className="text-center">
                  <button
                    className="btn-primary opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Request Withdrawal
                  </button>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Minimum 100 KES required
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary"
                  disabled={!profile?.available_balance_kes || profile.available_balance_kes < 100}
                >
                  Request Withdrawal
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${profile?.available_balance || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">≈ {profile?.available_balance_kes || 0} KES</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${profile?.total_earnings || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">≈ {profile?.total_earnings_kes || 0} KES</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal History</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Powered by</span>
                  <span className="ml-1 font-semibold text-[#0D9E86]">Paystack</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No withdrawal requests yet
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">${withdrawal.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{withdrawal.bank_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">****{withdrawal.account_number.slice(-4)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <WithdrawalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleWithdrawalSuccess}
        availableBalance={profile?.available_balance || 0}
        availableBalanceKes={profile?.available_balance_kes || 0}
      />
    </div>
  );
}