import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type CurrencyCode = 'KES' | 'USD' | 'EUR' | 'GBP' | 'NGN' | 'INR';

type CurrencyCtx = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyCtx | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>('KES');
  const value = useMemo(() => ({ currency, setCurrency }), [currency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyContext() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrencyContext must be used within CurrencyProvider');
  return ctx;
}
