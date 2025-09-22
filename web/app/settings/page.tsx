'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, findLanguageName } from '@/lib/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function SettingsPage() {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, ratesReady } = useCurrency();
  const [activeTab, setActiveTab] = useState<'general' | 'language' | 'currency' | 'status' | 'privacy' | 'notifications'>('general');
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('online_status') !== 'offline'; } catch { return true; }
  });
  const [freelancerPublished, setFreelancerPublished] = useState<boolean | null>(null);
  const [clientPublished, setClientPublished] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/profile/');
        const p = res.data?.profile || res.data;
        if (p?.timezone) setTimezone(p.timezone);
      } catch {}

      try {
        const res = await api.get('/profiles/freelancer/');
        if (res.data?.exists) setFreelancerPublished(Boolean(res.data.profile?.is_active));
        else setFreelancerPublished(null);
      } catch {
        setFreelancerPublished(null);
      }
      try {
        const r2 = await api.get('/profiles/client/');
        if (r2.data?.exists) setClientPublished(Boolean(r2.data.profile?.is_active));
        else setClientPublished(null);
      } catch {
        setClientPublished(null);
      }
    })();
  }, []);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await api.patch('/profile/update/', { timezone });
      toast.success('General settings saved');
    } catch {
      toast.error('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleOnline = (next: boolean) => {
    setOnline(next);
    try { localStorage.setItem('online_status', next ? 'online' : 'offline');
      const { setOnlineStatus } = require('@/lib/presence');
      setOnlineStatus(next);
    } catch {}
  };

  const toggleFreelancerPublish = async () => {
    try {
      const desired = !(freelancerPublished ?? false);
      await api.patch('/profile/freelancer/toggle-publish/', { is_active: desired });
      setFreelancerPublished(desired);
      toast.success(`Freelancer profile ${desired ? 'published' : 'unpublished'}`);
    } catch {
      toast.error('Failed to toggle freelancer profile publish state');
    }
  };

  const toggleClientPublish = async () => {
    try {
      const desired = !(clientPublished ?? false);
      await api.put('/profiles/client/', { is_active: desired });
      setClientPublished(desired);
      toast.success(`Client profile ${desired ? 'published' : 'unpublished'}`);
    } catch {
      toast.error('Failed to toggle client profile publish state');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your preferences and account configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 h-max">
            <nav className="space-y-1">
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='general'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('general')}>General</button>
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='language'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('language')}>Language</button>
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='currency'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('currency')}>Currency</button>
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='status'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('status')}>Online Status</button>
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='privacy'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('privacy')}>Privacy</button>
              <button className={`w-full text-left px-3 py-2 rounded ${activeTab==='notifications'?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
            </nav>
          </aside>

          {/* Content */}
          <section className="lg:col-span-3 space-y-6">
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">General</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Theme</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Toggle light/dark theme</div>
                  </div>
                  <button onClick={toggleTheme} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Toggle Theme ({theme})</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                    <input value={timezone} onChange={(e)=>setTimezone(e.target.value)} placeholder="e.g. Africa/Nairobi" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent"/>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={saveGeneral} disabled={saving} className="btn-primary disabled:opacity-50">{saving?'Saving...':'Save'}</button>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Language</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current language: <strong>{findLanguageName(language)}</strong></p>
                <Link href="/settings/language" className="text-blue-600 dark:text-blue-400 underline">Open full language list</Link>
              </div>
            )}

            {activeTab === 'currency' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Currency</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preferred: <strong>{currency}</strong></p>
                {!ratesReady && <p className="text-xs text-gray-500">Loading rates...</p>}
                <Link href="/settings/currency" className="text-blue-600 dark:text-blue-400 underline">Change currency</Link>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Online Status</h2>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Control whether you appear online</div>
                  <button onClick={()=>toggleOnline(!online)} className={`px-3 py-1 rounded-full text-sm ${online?'bg-green-600 text-white':'bg-gray-300 text-gray-800'}`}>{online?'Online':'Offline'}</button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Privacy</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Freelancer profile visibility</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Publish/unpublish your freelancer profile to make gigs visible</div>
                    </div>
                    <button onClick={toggleFreelancerPublish} className={`px-3 py-1 rounded-full text-sm ${freelancerPublished? 'bg-green-600 text-white':'bg-gray-300 text-gray-800'}`}>{freelancerPublished? 'Published':'Unpublished'}</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Client profile visibility</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Publish/unpublish your client profile (controls job posting visibility)</div>
                    </div>
                    <button onClick={toggleClientPublish} className={`px-3 py-1 rounded-full text-sm ${clientPublished? 'bg-green-600 text-white':'bg-gray-300 text-gray-800'}`}>{clientPublished? 'Published':'Unpublished'}</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Notifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your notification channels and frequency.</p>
                <Link href="/notifications/settings" className="btn-primary inline-block">Open Notification Settings</Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

