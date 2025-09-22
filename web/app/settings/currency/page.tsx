'use client';

import Navigation from '@/components/Navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { type CurrencyCode } from '@/lib/currency';
import { useMemo } from 'react';

const ALL: CurrencyCode[] = ['USD','KES','EUR','GBP','NGN','INR','CAD','AUD','ZAR','BRL','JPY','CNY','AED','SAR','UGX','TZS','GHS'];

export default function CurrencySettingsPage() {
  const { currency, setCurrency, ratesReady } = useCurrency();

  const others = useMemo(()=> ALL.filter(c => c !== currency), [currency]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Currency Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Preferred currency: <strong>{currency}</strong></p>
          {!ratesReady && <p className="text-xs text-gray-500">Loading exchange rates...</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[currency, ...others].map(c => (
            <button key={c} onClick={()=>setCurrency(c)} className={`px-3 py-2 rounded border ${c===currency ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20':'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{c}</button>
          ))}
        </div>
      </main>
    </div>
  );
}

