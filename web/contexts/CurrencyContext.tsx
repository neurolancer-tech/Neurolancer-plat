'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { convert, convertUSDToKES, formatCurrency, getPreferredCurrency, setPreferredCurrency, type CurrencyCode, getUsdBaseRates } from '@/lib/currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  convert: (amount: number, from: CurrencyCode, to: CurrencyCode) => Promise<number>;
  format: (amount: number, currency: CurrencyCode) => string;
  usdToKes: (amountUsd: number) => Promise<number>;
  ratesReady: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    // Initialize preferred currency
    try {
      const pref = getPreferredCurrency();
      setCurrencyState(pref);
    } catch {}

    // Warm up rates cache
    (async () => {
      try {
        await getUsdBaseRates();
      } finally {
        setRatesReady(true);
      }
    })();
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setPreferredCurrency(c);
    setCurrencyState(c);
  };

  const value: CurrencyContextValue = useMemo(() => ({
    currency,
    setCurrency,
    convert,
    format: (amount, curr) => formatCurrency(amount, curr),
    usdToKes: convertUSDToKES,
    ratesReady,
  }), [currency, ratesReady]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
