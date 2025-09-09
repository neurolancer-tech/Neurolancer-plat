// Currency conversion utility for USD to KES
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const CACHE_KEY = 'usd_kes_rate';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Get cached exchange rate or fetch new one
 */
async function getExchangeRate() {
  try {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rate;
      }
    }

    // Fetch new rate
    const response = await fetch(EXCHANGE_RATE_API);
    const data = await response.json();
    const kesRate = data.rates.KES;

    // Cache the rate
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rate: kesRate,
      timestamp: Date.now()
    }));

    return kesRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback rate (approximate)
    return 130; // 1 USD = 130 KES (fallback)
  }
}

/**
 * Convert USD amount to KES
 */
export async function convertUSDToKES(usdAmount) {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  
  const rate = await getExchangeRate();
  return Math.round(parseFloat(usdAmount) * rate);
}

/**
 * Format KES amount with proper formatting
 */
export function formatKES(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}