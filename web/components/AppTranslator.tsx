"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Invisible global translator that runs on the client after hydration.
// It observes DOM mutations and translates visible text nodes in-place,
// using our server proxy at /api/translate. This is best-effort and meant
// for quick whole-page language conversion.

const EXCLUDED_TAGS = new Set([
  'SCRIPT','STYLE','NOSCRIPT','IFRAME','OBJECT','CANVAS','SVG','IMG','VIDEO','AUDIO','PICTURE','SOURCE','TRACK','META','LINK','HEAD','HTML','BODY','CODE','PRE','KBD','SAMP','TEXTAREA','INPUT'
]);

const MAX_TEXT_LEN = 280; // skip extremely long strings
const MIN_TEXT_LEN = 2;   // skip very short
const BATCH_SIZE = 40;    // per request batch size
const FLUSH_MS = 250;     // debounce for batching API calls
const LS_PREFIX = 'nl_tr_cache_';

function isExcluded(el: Element | null): boolean {
  if (!el) return true;
  if (EXCLUDED_TAGS.has(el.tagName)) return true;
  // also skip contenteditable
  const editable = (el as HTMLElement).isContentEditable;
  return !!editable;
}

function shouldTranslateText(s: string): boolean {
  const t = s.trim();
  if (t.length < MIN_TEXT_LEN) return false;
  if (t.length > MAX_TEXT_LEN) return false;
  // ignore strings that are mostly punctuation or whitespace
  if (!/[A-Za-z\p{L}]/u.test(t)) return false;
  return true;
}

function loadCache(lang: string): Map<string, string> {
  try {
    const raw = localStorage.getItem(LS_PREFIX + lang);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(obj));
  } catch { return new Map(); }
}

function saveCache(lang: string, map: Map<string,string>) {
  try {
    // cap cache size to avoid bloating localStorage
    const MAX_ENTRIES = 2000;
    const obj: Record<string,string> = {};
    let i = 0;
    for (const [k,v] of map) {
      obj[k] = v;
      if (++i >= MAX_ENTRIES) break;
    }
    localStorage.setItem(LS_PREFIX + lang, JSON.stringify(obj));
  } catch {}
}

async function translateBatch(q: string[], source: string, target: string): Promise<string[]> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ q, source, target, format: 'text' })
    });
    if (!res.ok) throw new Error('translate batch failed');
    const j = await res.json();
    const arr: string[] | undefined = j?.translations;
    if (Array.isArray(arr) && arr.length === q.length) return arr;
    // fallback: if server returned single translatedText for some reason
    if (typeof j?.translatedText === 'string') return [j.translatedText];
  } catch {}
  // graceful fallback – return originals
  return q;
}

export default function AppTranslator() {
  const { language } = useLanguage();
  const enabled = language && language !== 'en';

  const cacheRef = React.useRef<Map<string,string>>(new Map());
  const pendingSetRef = React.useRef<Set<string>>(new Set());
  const flushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = React.useRef<MutationObserver | null>(null);

  // replace text node value with translated text from cache if available
  const applyFromCache = React.useCallback((node: Text) => {
    const original = node.nodeValue || '';
    if (!shouldTranslateText(original)) return;
    const cached = cacheRef.current.get(original);
    if (cached && cached !== original) {
      node.nodeValue = cached;
    }
  }, []);

  // schedule a string for translation
  const schedule = React.useCallback((s: string) => {
    pendingSetRef.current.add(s);
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(async () => {
      const all = Array.from(pendingSetRef.current);
      pendingSetRef.current.clear();
      flushTimerRef.current = null;
      // chunk
      for (let i = 0; i < all.length; i += BATCH_SIZE) {
        const chunk = all.slice(i, i + BATCH_SIZE);
        const translated = await translateBatch(chunk, 'en', language);
        translated.forEach((t, idx) => {
          const orig = chunk[idx];
          cacheRef.current.set(orig, t);
        });
        saveCache(language, cacheRef.current);
        // after updating cache, do a quick re-apply pass over current DOM nodes likely containing these strings
        reapplyToDocument();
      }
    }, FLUSH_MS);
  }, [language]);

  const scanTextNodes = React.useCallback((root: Node) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const text = (node as Text).nodeValue || '';
        const parent = (node as Text).parentElement;
        if (!parent || isExcluded(parent)) return NodeFilter.FILTER_REJECT;
        const ok = shouldTranslateText(text);
        return ok ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    } as any);

    const toTranslate: string[] = [];
    let n: Node | null = walker.nextNode();
    while (n) {
      const textNode = n as Text;
      const original = textNode.nodeValue || '';
      const cached = cacheRef.current.get(original);
      if (cached && cached !== original) {
        textNode.nodeValue = cached;
      } else {
        // schedule unknown strings for translation
        toTranslate.push(original);
      }
      n = walker.nextNode();
    }

    // dedupe and schedule
    const uniq = Array.from(new Set(toTranslate));
    for (const s of uniq) schedule(s);
  }, [schedule]);

  const reapplyToDocument = React.useCallback(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const text = (node as Text).nodeValue || '';
        const parent = (node as Text).parentElement;
        if (!parent || isExcluded(parent)) return NodeFilter.FILTER_REJECT;
        const ok = shouldTranslateText(text);
        return ok ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    } as any);
    let n: Node | null = walker.nextNode();
    while (n) {
      applyFromCache(n as Text);
      n = walker.nextNode();
    }
  }, [applyFromCache]);

  // Reset on language change
  React.useEffect(() => {
    if (!enabled) return;
    cacheRef.current = loadCache(language);
    // initial scan after hydration
    scanTextNodes(document.body);

    // observe mutations
    if (observerRef.current) observerRef.current.disconnect();
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              const txt = node as Text;
              if (shouldTranslateText(txt.nodeValue || '')) {
                const cached = cacheRef.current.get(txt.nodeValue || '');
                if (cached) txt.nodeValue = cached;
                else if (txt.nodeValue) schedule(txt.nodeValue);
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              if (!isExcluded(el)) scanTextNodes(el);
            }
          });
        } else if (m.type === 'characterData') {
          const tn = m.target as Text;
          const val = tn.nodeValue || '';
          if (shouldTranslateText(val)) {
            const cached = cacheRef.current.get(val);
            if (cached) tn.nodeValue = cached;
            else schedule(val);
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    observerRef.current = obs;

    return () => { obs.disconnect(); };
  }, [enabled, language, scanTextNodes, schedule]);

  // If disabled (English), disconnect observer
  React.useEffect(() => {
    if (enabled) return;
    if (observerRef.current) observerRef.current.disconnect();
  }, [enabled]);

  // Invisible component
  return null;
}

