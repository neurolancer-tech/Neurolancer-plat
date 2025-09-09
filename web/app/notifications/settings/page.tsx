'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface NotificationSetting {
  category: string;
  delivery_method: string;
  is_enabled: boolean;
  frequency: string;
}

interface NotificationSettings {
  [category: string]: {
    [method: string]: {
      is_enabled: boolean;
      frequency: string;
    };
  };
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/notifications/settings/');
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, method: string, field: 'is_enabled' | 'frequency', value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [method]: {
          ...prev[category]?.[method],
          [field]: value
        }
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const preferences: NotificationSetting[] = [];
      
      Object.entries(settings).forEach(([category, methods]) => {
        Object.entries(methods).forEach(([method, config]) => {
          preferences.push({
            category,
            delivery_method: method,
            is_enabled: config.is_enabled,
            frequency: config.frequency
          });
        });
      });

      await api.post('/notifications/preferences/update/', { preferences });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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

  const categories = [
    ['order_updates', 'Order Updates'],
    ['messages', 'Messages'],
    ['proposals', 'Proposals'],
    ['payments', 'Payments'],
    ['system_notifications', 'System Notifications']
  ];

  const deliveryMethods = [
    ['in_app', 'In-app'],
    ['email', 'Email']
  ];

  const frequencyOptions = [
    ['instant', 'Instant'],
    ['daily', 'Daily'],
    ['weekly', 'Weekly'],
    ['disabled', 'Disabled']
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-2">Customize how you receive notifications</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-8">
              {categories.map(([categoryKey, categoryLabel]) => (
                <div key={categoryKey} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{categoryLabel}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {deliveryMethods.map(([methodKey, methodLabel]) => {
                      const currentSetting = settings[categoryKey]?.[methodKey] || {
                        is_enabled: true,
                        frequency: 'instant'
                      };
                      
                      return (
                        <div key={methodKey} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">{methodLabel}</label>
                            <button
                              onClick={() => updateSetting(categoryKey, methodKey, 'is_enabled', !currentSetting.is_enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                currentSetting.is_enabled ? 'bg-primary' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  currentSetting.is_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          
                          {currentSetting.is_enabled && (
                            <select
                              value={currentSetting.frequency}
                              onChange={(e) => updateSetting(categoryKey, methodKey, 'frequency', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {frequencyOptions.map(([freqKey, freqLabel]) => (
                                <option key={freqKey} value={freqKey}>{freqLabel}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn-primary disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}