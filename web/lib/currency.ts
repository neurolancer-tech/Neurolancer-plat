// Currency conversion utility
const EXCHANGE_RATE_KEY = 'usd_to_kes_rate';
const RATE_TIMESTAMP_KEY = 'rate_timestamp';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface ExchangeRateResponse {
  rates: {
    KES: number;
  };
}

export const getCachedExchangeRate = (): number | null => {
  if (typeof window === 'undefined') return null;
  
  const rate = localStorage.getItem(EXCHANGE_RATE_KEY);
  const timestamp = localStorage.getItem(RATE_TIMESTAMP_KEY);
  
  if (!rate || !timestamp) return null;
  
  const now = Date.now();
  const cacheTime = parseInt(timestamp);
  
  if (now - cacheTime > CACHE_DURATION) {
    localStorage.removeItem(EXCHANGE_RATE_KEY);
    localStorage.removeItem(RATE_TIMESTAMP_KEY);
    return null;
  }
  
  return parseFloat(rate);
};

export const fetchExchangeRate = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data: ExchangeRateResponse = await response.json();
    const rate = data.rates.KES;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXCHANGE_RATE_KEY, rate.toString());
      localStorage.setItem(RATE_TIMESTAMP_KEY, Date.now().toString());
    }
    
    return rate;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return 130; // Fallback rate
  }
};

export const getExchangeRate = async (): Promise<number> => {
  const cached = getCachedExchangeRate();
  if (cached) return cached;
  
  return await fetchExchangeRate();
};

export const convertUSDToKES = async (usdAmount: number): Promise<number> => {
  const rate = await getExchangeRate();
  return Math.round(usdAmount * rate);
};

export const formatKES = (amount: number): string => {
  return `KES ${amount.toLocaleString()}`;
};