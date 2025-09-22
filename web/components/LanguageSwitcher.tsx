'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, findLanguageName } from '@/lib/languages';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onClick = () => setOpen(false);
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return LANGUAGES.filter(l =>
      l.name.toLowerCase().includes(q) || (l.native || '').toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [query]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="px-2 py-1 rounded-lg text-white hover:text-gray-200 hover:bg-white/10 text-xs border border-white/20"
        aria-label="Change language"
        title={`Language: ${findLanguageName(language)}`}
      >
        {language.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md z-50 p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search language"
            className="w-full mb-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
          />
          <div className="max-h-60 overflow-auto">
            {filtered.map(l => (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code); setOpen(false); }}
                className={`w-full text-left px-2 py-1 text-sm rounded ${
                  l.code === language ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } text-gray-700 dark:text-gray-200`}
                title={l.native || l.name}
              >
                {l.name}{l.native ? ` (${l.native})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

