'use client';

import Navigation from '@/components/Navigation';
import { useEffect, useState } from 'react';

export default function OnlineStatusSettingsPage() {
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('online_status') !== 'offline'; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('online_status', online ? 'online' : 'offline');
      const { setOnlineStatus } = require('@/lib/presence');
      setOnlineStatus(online);
    } catch {}
  }, [online]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Online Status</h1>
          <p className="text-gray-600 dark:text-gray-400">Control whether you appear online in the UI.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${online?'bg-green-500':'bg-gray-400'}`} />
            <span className="text-gray-800 dark:text-gray-100">{online?'Online':'Offline'}</span>
          </div>
          <button onClick={()=>setOnline(!online)} className={`px-3 py-1 rounded-full text-sm ${online?'bg-green-600 text-white':'bg-gray-300 text-gray-800'}`}>{online?'Go Offline':'Go Online'}</button>
        </div>
      </main>
    </div>
  );
}

