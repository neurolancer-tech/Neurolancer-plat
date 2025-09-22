// Lightweight client-side translation helper (optional preview)
// Now proxies via our server endpoint to avoid CORS and add fallbacks server-side.
export async function translatePreview(text: string, target: string, source = 'en'): Promise<string> {
  if (!text || !target) return text;
  try {
    const data = await fetchJSON('/api/translate', { q: text, source, target, format: 'text' });
    if (data?.translatedText) return data.translatedText as string;
  } catch {}
  return text;
}

async function fetchJSON(url: string, payload: any): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('translate fetch failed');
  return res.json();
}

