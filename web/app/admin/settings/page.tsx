'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    platform: {
      name: 'Neurolancer',
      description: 'AI Freelance Marketplace',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    fees: {
      platformFeePercentage: 10,
      paymentProcessingFee: 2.9,
      withdrawalFee: 2.0,
      minimumWithdrawal: 50
    },
    limits: {
      maxGigPrice: 10000,
      maxProjectBudget: 100000,
      maxFileUploadSize: 50,
      maxMessageLength: 5000
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: true
    }
  });

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
  }, [router]);

  const updateSettings = async (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
    
    // Mock API call
    console.log(`Updated ${section}.${key} to:`, value);
  };

  const saveAllSettings = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Platform Settings</h1>
          <p className="opacity-90">Configure platform-wide settings and preferences</p>
        </div>

        {/* Platform Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Platform Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platform.name}
                onChange={(e) => updateSettings('platform', 'name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Description
              </label>
              <input
                type="text"
                value={settings.platform.description}
                onChange={(e) => updateSettings('platform', 'description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Maintenance Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Temporarily disable platform access</p>
              </div>
              <button
                onClick={() => updateSettings('platform', 'maintenanceMode', !settings.platform.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.platform.maintenanceMode ? 'bg-[#FF8559]' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.platform.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">User Registration</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow new user registrations</p>
              </div>
              <button
                onClick={() => updateSettings('platform', 'registrationEnabled', !settings.platform.registrationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.platform.registrationEnabled ? 'bg-[#0D9E86]' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.platform.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Verification</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Require email verification for new accounts</p>
              </div>
              <button
                onClick={() => updateSettings('platform', 'emailVerificationRequired', !settings.platform.emailVerificationRequired)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.platform.emailVerificationRequired ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.platform.emailVerificationRequired ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Fee Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Fee Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Fee (%)
              </label>
              <input
                type="number"
                value={settings.fees.platformFeePercentage}
                onChange={(e) => updateSettings('fees', 'platformFeePercentage', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0"
                max="50"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Processing Fee (%)
              </label>
              <input
                type="number"
                value={settings.fees.paymentProcessingFee}
                onChange={(e) => updateSettings('fees', 'paymentProcessingFee', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0"
                max="10"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Withdrawal Fee ($)
              </label>
              <input
                type="number"
                value={settings.fees.withdrawalFee}
                onChange={(e) => updateSettings('fees', 'withdrawalFee', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Withdrawal ($)
              </label>
              <input
                type="number"
                value={settings.fees.minimumWithdrawal}
                onChange={(e) => updateSettings('fees', 'minimumWithdrawal', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Platform Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Platform Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Gig Price ($)
              </label>
              <input
                type="number"
                value={settings.limits.maxGigPrice}
                onChange={(e) => updateSettings('limits', 'maxGigPrice', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Project Budget ($)
              </label>
              <input
                type="number"
                value={settings.limits.maxProjectBudget}
                onChange={(e) => updateSettings('limits', 'maxProjectBudget', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max File Upload Size (MB)
              </label>
              <input
                type="number"
                value={settings.limits.maxFileUploadSize}
                onChange={(e) => updateSettings('limits', 'maxFileUploadSize', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Message Length
              </label>
              <input
                type="number"
                value={settings.limits.maxMessageLength}
                onChange={(e) => updateSettings('limits', 'maxMessageLength', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="100"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveAllSettings}
            disabled={loading}
            className="bg-[#0D9E86] text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}