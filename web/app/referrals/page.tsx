'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import Navigation from '@/components/Navigation';

interface ReferralInfo {
  referral_code: string;
  referral_url: string;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  withdrawn_earnings: number;
  signup_bonuses: number;
  percentage_earnings: number;
  recent_referrals: Array<{
    username: string;
    status: string;
    signed_up_at: string;
    bonus_paid: boolean;
    bonus_amount: number;
  }>;
  settings: {
    signup_bonus_amount: number;
    earnings_percentage: number;
    signup_bonus_enabled: boolean;
    earnings_percentage_enabled: boolean;
    min_payout_amount: number;
  };
}

export default function ReferralsPage() {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    fetchReferralData();
  }, [router]);

  const fetchReferralData = async () => {
    try {
      if (!isAuthenticated()) {
        router.push('/auth');
        return;
      }

      const response = await api.get('/referrals/info/');

      setReferralInfo(response.data.data);
    } catch (err: any) {
      console.error('Error fetching referral data:', err);
      setError(err.response?.data?.error || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralInfo) return;
    
    try {
      await navigator.clipboard.writeText(referralInfo.referral_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !referralInfo) return;
    
    const amount = parseFloat(withdrawAmount);
    if (amount < referralInfo.settings.min_payout_amount) {
      setError(`Minimum withdrawal amount is $${referralInfo.settings.min_payout_amount}`);
      return;
    }

    if (amount > referralInfo.pending_earnings) {
      setError('Insufficient pending earnings');
      return;
    }

    setWithdrawing(true);
    try {
      await api.post('/referrals/withdraw/', {
        amount: amount,
        method: 'balance'
      });

      setWithdrawAmount('');
      fetchReferralData();
      alert('Withdrawal request submitted successfully!');
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.response?.data?.error || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const shareReferralLink = async (platform: string) => {
    if (!referralInfo) return;

    const text = `Join Neurolancer, the AI freelance marketplace! Use my referral link and we both earn $${referralInfo.settings.signup_bonus_amount}!`;
    const url = referralInfo.referral_url;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !referralInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">Error loading referral data</div>
            <div className="text-gray-600 dark:text-gray-400">{error}</div>
            <button 
              onClick={fetchReferralData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="mt-2 text-gray-600">
            Earn money by referring friends to Neurolancer!
          </p>
        </div>

        {referralInfo && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{referralInfo.total_referrals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${referralInfo.total_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Earnings</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${referralInfo.pending_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">💸</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Withdrawn</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${referralInfo.withdrawn_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Referral Link</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Share this link to earn ${referralInfo.settings.signup_bonus_amount} for each signup!</p>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={referralInfo.referral_url}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className={`px-4 py-2 rounded-md font-medium ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => shareReferralLink('twitter')}
                    className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 flex items-center space-x-2"
                  >
                    <span>🐦</span>
                    <span>Twitter</span>
                  </button>
                  <button
                    onClick={() => shareReferralLink('facebook')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>📘</span>
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => shareReferralLink('linkedin')}
                    className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 flex items-center space-x-2"
                  >
                    <span>💼</span>
                    <span>LinkedIn</span>
                  </button>
                  <button
                    onClick={() => shareReferralLink('whatsapp')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-2"
                  >
                    <span>📱</span>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How It Works</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Share Your Link</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Share your unique referral link with friends and colleagues</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">They Sign Up</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">When someone signs up using your link and verifies their email</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">You Earn Money</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Earn ${referralInfo.settings.signup_bonus_amount} instantly{referralInfo.settings.earnings_percentage_enabled && ` + ${referralInfo.settings.earnings_percentage}% of their earnings`}</p>
                  </div>
                </div>
              </div>
            </div>

            {referralInfo.pending_earnings >= referralInfo.settings.min_payout_amount && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Withdraw Earnings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Minimum withdrawal: ${referralInfo.settings.min_payout_amount}</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`Min $${referralInfo.settings.min_payout_amount}`}
                        max={referralInfo.pending_earnings}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || !withdrawAmount}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing ? 'Processing...' : 'Withdraw'}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}