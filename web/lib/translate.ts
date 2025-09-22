// Lightweight client-side translation helper (optional preview)
// Uses LibreTranslate public endpoint as a best-effort demo; gracefully falls back to source text
export async function translatePreview(text: string, target: string, source = 'en'): Promise<string> {
  try {
    if (!text || target === source) return text;
    const res = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' })
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.translatedText || text;
  } catch {
    return text;
  }
}

