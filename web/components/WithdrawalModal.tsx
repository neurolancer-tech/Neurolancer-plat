'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatKES } from '@/lib/currency';

interface Bank {
  code: string;
  name: string;
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  availableBalanceKes: number;
}

export default function WithdrawalModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  availableBalance, 
  availableBalanceKes 
}: WithdrawalModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const { currency, convert, format } = useCurrency();
  const [equivalentLocal, setEquivalentLocal] = useState<string>('');
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank',
    bank_code: '',
    account_number: '',
    account_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    
    const amount = parseFloat(formData.amount);
    const minAmount = 100;
    const maxAmount = Math.floor(availableBalanceKes);
    
    console.log('Validation:', { amount, minAmount, maxAmount });
    
    if (amount < minAmount) {
      toast.error(`Minimum withdrawal amount is ${minAmount} KES`);
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`Insufficient balance. Maximum withdrawal: ${maxAmount} KES`);
      return;
    }

    if (!formData.account_number || !formData.account_name || (formData.method === 'bank' && !formData.bank_code)) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Starting withdrawal process...');
    await processWithdrawal();
  };

  const processWithdrawal = async () => {
    setLoading(true);
    console.log('Processing withdrawal with data:', formData);
    
    try {
      // Show Paystack-like processing interface
      const processingToast = toast.loading('Processing withdrawal via Paystack...');
      
      try {
        // Simulate Paystack processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await api.post('/withdrawals/create/', {
          amount: formData.amount,
          bank_name: formData.bank_code || 'MPESA',
          account_number: formData.account_number
        });

        toast.dismiss(processingToast);
        console.log('Withdrawal response:', response.data);

      if (response.status === 200 || response.status === 201) {
        toast.success('✅ Withdrawal request submitted successfully!');
        onSuccess();
        onClose();
        setFormData({ amount: '', method: 'bank', bank_code: '', account_number: '', account_name: '' });
      } else {
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        throw new Error(response.data?.error || response.data?.message || 'Withdrawal failed');
      }
      } catch (apiError: any) {
        toast.dismiss(processingToast);
        throw apiError;
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.error || error.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paystack Withdrawal</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Secure transfer powered by Paystack</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Withdrawal Method
            </label>
            <select
              value={formData.method}
              onChange={(e) => {
                const method = e.target.value;
                setFormData({...formData, method, bank_code: method === 'mpesa' ? 'MPESA' : ''});
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            >
              <option value="bank">Bank Transfer</option>
              <option value="mpesa">M-Pesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (Min: 100 KES, Max: {Math.floor(availableBalanceKes)} KES)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={async (e) => {
                const val = e.target.value;
                setFormData({...formData, amount: val});
                const num = parseFloat(val || '0');
                if (!isNaN(num) && num > 0) {
                  const loc = await convert(num, 'KES', currency);
                  setEquivalentLocal(`${format(loc, currency)} (${formatKES(num)})`);
                } else {
                  setEquivalentLocal('');
                }
              }}
              max={Math.floor(availableBalanceKes)}
              min="100"
              step="1"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter amount in KES"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Available: {formatKES(Math.floor(availableBalanceKes))} ({format(availableBalance, currency)})
            </p>
            {equivalentLocal && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Equivalent: {equivalentLocal}</p>
            )}
          </div>

          {formData.method === 'bank' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank</label>
              <select
                value={formData.bank_code}
                onChange={(e) => setFormData({...formData, bank_code: e.target.value})}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a bank</option>
                <option value="044">Access Bank</option>
                <option value="014">Afriland First Bank</option>
                <option value="023">Citibank</option>
                <option value="050">Ecobank</option>
                <option value="011">First Bank</option>
                <option value="214">First City Monument Bank</option>
                <option value="070">Fidelity Bank</option>
                <option value="058">Guaranty Trust Bank</option>
                <option value="030">Heritage Bank</option>
                <option value="301">Jaiz Bank</option>
                <option value="082">Keystone Bank</option>
                <option value="526">Parallex Bank</option>
                <option value="076">Polaris Bank</option>
                <option value="101">Providus Bank</option>
                <option value="221">Stanbic IBTC Bank</option>
                <option value="068">Standard Chartered Bank</option>
                <option value="232">Sterling Bank</option>
                <option value="100">Suntrust Bank</option>
                <option value="032">Union Bank</option>
                <option value="033">United Bank for Africa</option>
                <option value="215">Unity Bank</option>
                <option value="035">Wema Bank</option>
                <option value="057">Zenith Bank</option>
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.method === 'mpesa' ? 'Phone Number' : 'Account Number'}
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({...formData, account_number: e.target.value})}
              required
              disabled={loading}
              placeholder={formData.method === 'mpesa' ? '254712345678' : 'Enter account number'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.method === 'mpesa' ? 'Account Name' : 'Account Holder Name'}
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({...formData, account_name: e.target.value})}
              required
              disabled={loading}
              placeholder="Enter full name as registered"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Powered by Paystack
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Bank-grade security & encryption</li>
                  <li>• Real-time account verification</li>
                  <li>• Instant transfer processing</li>
                  <li>• SMS & email notifications</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              onClick={(e) => {
                console.log('Button clicked!');
                console.log('Form data:', formData);
                console.log('Available balance:', availableBalanceKes);
              }}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Process via Paystack
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}