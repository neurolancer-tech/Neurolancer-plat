'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

export type LanguageCode = string; // ISO codes like 'en', 'fr', 'es'

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const COOKIE_KEY = 'lang';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const fromCookie = Cookies.get(COOKIE_KEY);
      if (fromCookie) setLanguageState(fromCookie);
      else {
        // Default from browser
        const nav = navigator.language || 'en';
        setLanguageState(nav.split('-')[0] || 'en');
      }
    } catch {}
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try { Cookies.set(COOKIE_KEY, lang, { expires: 365 }); } catch {}
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

