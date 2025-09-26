'use client';

import { useEffect, useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { type CurrencyCode } from '@/lib/currency';

const OPTIONS: CurrencyCode[] = ['KES','USD','EUR','GBP','NGN','INR'];

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = () => setOpen(false);
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="px-2 py-1 rounded-lg text-white hover:text-gray-200 hover:bg-white/10 text-xs border border-white/20"
        aria-label="Change currency"
      >
        {currency}
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md z-50">
          {OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => { setCurrency(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm ${opt === currency ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} text-gray-700 dark:text-gray-200`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
