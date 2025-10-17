import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'sw' | 'pt' | 'hi';

type LangCtx = {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
};

const LanguageContext = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguageContext must be used within LanguageProvider');
  return ctx;
}
