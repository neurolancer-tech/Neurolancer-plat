// Lightweight client-side translation helper (optional preview)
// Uses LibreTranslate public endpoint as a best-effort demo; gracefully falls back to source text
export async function translatePreview(text: string, target: string, source = 'en'): Promise<string> {
  if (!text || !target) return text;
  // try LibreTranslate primary
  try {
    const data = await fetchJSON('https://libretranslate.com/translate', { q: text, source, target, format: 'text' });
    if (data?.translatedText) return data.translatedText as string;
  } catch {}
  // fallback LibreTranslate (DE mirror)
  try {
    const data2 = await fetchJSON('https://libretranslate.de/translate', { q: text, source, target, format: 'text' });
    if (data2?.translatedText) return data2.translatedText as string;
  } catch {}
  // fallback MyMemory (rate-limited but often CORS-friendly)
  try {
    const mm = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`, { headers: { 'Accept': 'application/json' } });
    if (mm.ok) {
      const j = await mm.json();
      const t = j?.responseData?.translatedText;
      if (typeof t === 'string' && t.length) return t;
    }
  } catch {}
  return text;
}

async function fetchJSON(url: string, payload: any): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
    mode: 'cors',
  });
  if (!res.ok) throw new Error('translate fetch failed');
  return res.json();
}

