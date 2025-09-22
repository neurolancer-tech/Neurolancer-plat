'use client';

import Navigation from '@/components/Navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, findLanguageName } from '@/lib/languages';
import { useMemo, useState } from 'react';
import { translatePreview } from '@/lib/translate';

export default function LanguageSettingsPage() {
  const { language, setLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [previewText, setPreviewText] = useState('Welcome to Neurolancer!');
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return LANGUAGES.filter(l => l.name.toLowerCase().includes(q) || (l.native||'').toLowerCase().includes(q) || l.code.toLowerCase().includes(q));
  }, [query]);

  const doTranslate = async (code: string) => {
    setLoading(true);
    try {
      const res = await translatePreview(previewText, code, 'en');
      setTranslated(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Language Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Current language: <strong>{findLanguageName(language)}</strong></p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search languages" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 max-h-[420px] overflow-auto">
            {filtered.map(l => (
              <button key={l.code} onClick={()=>{ setLanguage(l.code); doTranslate(l.code); }} className={`px-3 py-2 rounded text-left border ${l.code===language ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20':'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className="font-medium text-gray-900 dark:text-gray-100">{l.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{l.native || l.code}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Preview translation (powered by LibreTranslate; best-effort)</div>
          <textarea value={previewText} onChange={(e)=>setPreviewText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent" rows={3}/>
          <button onClick={()=>doTranslate(language)} className="btn-primary w-max">Translate to {findLanguageName(language)}</button>
          <div className="min-h-12 text-gray-900 dark:text-gray-100 text-sm">
            {loading ? 'Translating...' : translated || '—'}
          </div>
        </div>
      </main>
    </div>
  );
}

