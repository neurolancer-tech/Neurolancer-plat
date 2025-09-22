import { NextRequest, NextResponse } from 'next/server';

// Optional environment configuration
// If you self-host LibreTranslate or have an API key, set these:
// LT_API_URL=https://your-libretranslate-instance/translate
// LT_API_KEY=your_api_key

const PRIMARY_LT = process.env.LT_API_URL || 'https://libretranslate.com/translate';
const FALLBACK_LT = 'https://libretranslate.de/translate';

export const runtime = 'node';
export const dynamic = 'force-dynamic';

interface TranslateBody {
  q: string | string[];
  source?: string; // e.g., 'en' or 'auto'
  target: string;  // e.g., 'fr'
  format?: 'text' | 'html';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateBody;
    const source = body.source || 'auto';
    const target = body.target;
    const format = body.format || 'text';
    const apiKey = process.env.LT_API_KEY;

    if (!target || !body.q || (Array.isArray(body.q) && body.q.length === 0)) {
      return NextResponse.json({ error: 'Missing q or target' }, { status: 400 });
    }

    // Normalize to array for processing
    const items = Array.isArray(body.q) ? body.q : [body.q];

    // Limit batch size for safety
    const MAX_BATCH = 50;
    if (items.length > MAX_BATCH) {
      return NextResponse.json({ error: `Too many items in one request (max ${MAX_BATCH})` }, { status: 400 });
    }

    // Helper to call a LibreTranslate endpoint for a single string
    const callLibre = async (endpoint: string, text: string) => {
      const payload: Record<string, any> = { q: text, source, target, format };
      if (apiKey) payload.api_key = apiKey;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        // No CORS needed server-side
      });
      if (!res.ok) throw new Error(`LT ${endpoint} status ${res.status}`);
      const j = await res.json();
      const t = j?.translatedText;
      if (typeof t !== 'string') throw new Error('Invalid response');
      return t as string;
    };

    // MyMemory fallback (free, CORS-friendly, but rate-limited and less accurate)
    const callMyMemory = async (text: string) => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source)}` +
                  `|${encodeURIComponent(target)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`MyMemory status ${res.status}`);
      const j = await res.json();
      const t = j?.responseData?.translatedText;
      if (typeof t !== 'string') throw new Error('Invalid MyMemory response');
      return t as string;
    };

    // Translate sequentially to maintain order and avoid hammering free endpoints
    const results: string[] = [];
    for (const text of items) {
      if (!text) { results.push(''); continue; }
      let translated: string | null = null;
      try {
        translated = await callLibre(PRIMARY_LT, text);
      } catch {
        try {
          translated = await callLibre(FALLBACK_LT, text);
        } catch {
          try {
            translated = await callMyMemory(text);
          } catch {
            translated = text; // graceful fallback
          }
        }
      }
      results.push(translated || text);
    }

    // If the caller sent a single string, mirror the original translate.ts shape
    if (!Array.isArray(body.q)) {
      return NextResponse.json({ translatedText: results[0] ?? '' });
    }
    return NextResponse.json({ translations: results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

