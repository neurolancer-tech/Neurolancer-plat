// Currency conversion utility (multi-currency)
// Live rates via free endpoints with caching and fallbacks
// Base: USD rates map { currencyCode: ratePerUSD }

const RATES_CACHE_KEY = 'fx_rates_usd_base';
const RATES_TS_KEY = 'fx_rates_usd_base_ts';
const PREF_CURRENCY_KEY = 'preferred_currency';
const CACHE_DURATION = 3600000; // 1 hour

export type CurrencyCode =
  | 'USD' | 'KES' | 'EUR' | 'GBP' | 'NGN' | 'INR' | 'CAD' | 'AUD' | 'ZAR' | 'BRL' | 'JPY' | 'CNY' | 'AED' | 'SAR' | 'UGX' | 'TZS' | 'GHS';

type RatesMap = Record<string, number>;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', KES: 'KES', EUR: '€', GBP: '£', NGN: '₦', INR: '₹', CAD: 'CA$', AUD: 'A$', ZAR: 'R', BRL: 'R$', JPY: '¥', CNY: '¥', AED: 'AED', SAR: 'SAR', UGX: 'USh', TZS: 'TSh', GHS: '₵'
};

const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  KE: 'KES', US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', PT: 'EUR', IE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
  NG: 'NGN', ZA: 'ZAR', IN: 'INR', CA: 'CAD', AU: 'AUD', BR: 'BRL', JP: 'JPY', CN: 'CNY', AE: 'AED', SA: 'SAR', UG: 'UGX', TZ: 'TZS', GH: 'GHS'
};

function getCachedRates(): { rates: RatesMap | null, ts: number | null } {
  if (typeof window === 'undefined') return { rates: null, ts: null };
  try {
    const ratesStr = localStorage.getItem(RATES_CACHE_KEY);
    const tsStr = localStorage.getItem(RATES_TS_KEY);
    if (!ratesStr || !tsStr) return { rates: null, ts: null };
    const rates = JSON.parse(ratesStr) as RatesMap;
    const ts = parseInt(tsStr, 10);
    if (Date.now() - ts > CACHE_DURATION) {
      localStorage.removeItem(RATES_CACHE_KEY);
      localStorage.removeItem(RATES_TS_KEY);
      return { rates: null, ts: null };
    }
    return { rates, ts };
  } catch {
    return { rates: null, ts: null };
  }
}

async function fetchRatesFromPrimary(): Promise<RatesMap> {
  // exchangerate.host is free
  const res = await fetch('https://api.exchangerate.host/latest?base=USD');
  const data = await res.json();
  return data?.rates || {};
}

async function fetchRatesFromFallback(): Promise<RatesMap> {
  // open.er-api.com is a free fallback
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  const data = await res.json();
  return data?.rates || {};
}

export async function getUsdBaseRates(): Promise<RatesMap> {
  const { rates } = getCachedRates();
  if (rates && rates['KES']) return rates;
  let fresh: RatesMap = {};
  try {
    fresh = await fetchRatesFromPrimary();
    if (!fresh || !fresh['KES']) throw new Error('Primary FX fetch missing KES');
  } catch {
    try {
      fresh = await fetchRatesFromFallback();
    } catch {
      fresh = {};
    }
  }
  if (typeof window !== 'undefined' && fresh && Object.keys(fresh).length) {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(fresh));
    localStorage.setItem(RATES_TS_KEY, Date.now().toString());
  }
  return fresh;
}

export async function convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<number> {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  const rates = await getUsdBaseRates();
  if (!rates[from] || !rates[to]) {
    // Minimal fallback for KES if only that is needed
    if (from === 'USD' && rates['KES'] && to === 'KES') return amount * rates['KES'];
    if (to === 'USD' && rates[from]) return amount / rates[from];
    return amount; // last-resort
  }
  // amount_in_usd = amount / rate[from]; then to = * rate[to]
  const amountInUsd = amount / rates[from];
  return amountInUsd * rates[to];
}

export async function convertUSDToKES(usdAmount: number): Promise<number> {
  const rates = await getUsdBaseRates();
  const kesRate = rates['KES'] || 130;
  return Math.round(usdAmount * kesRate);
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] || '';
    return `${symbol} ${amount.toLocaleString()}`.trim();
  }
}

export function formatKES(amount: number): string {
  return formatCurrency(amount, 'KES');
}

export function getPreferredCurrency(): CurrencyCode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(PREF_CURRENCY_KEY);
    if (saved) return saved as CurrencyCode;
    try {
      const profileStr = (window as any).Cookies?.get?.('profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        const cc = (profile?.country_code || '').toUpperCase();
        const ctry = (profile?.country || '').toUpperCase();
        if (cc && COUNTRY_TO_CURRENCY[cc]) return COUNTRY_TO_CURRENCY[cc];
        if (ctry.includes('KENYA')) return 'KES';
      }
    } catch {}
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    if (locale.includes('-KE')) return 'KES';
  }
  return 'USD';
}

export function setPreferredCurrency(curr: CurrencyCode) {
  if (typeof window !== 'undefined') localStorage.setItem(PREF_CURRENCY_KEY, curr);
}

export { CURRENCY_SYMBOLS, COUNTRY_TO_CURRENCY };
