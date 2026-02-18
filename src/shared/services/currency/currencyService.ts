/**
 * Castar — Currency conversion service
 * Uses frankfurter.app (free, no API key) for exchange rates.
 * Caches rates locally.
 */

interface RateCache {
  [pair: string]: {
    rate: number;
    fetchedAt: number;
  };
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const rateCache: RateCache = {};

function cacheKey(from: string, to: string): string {
  return `${from}_${to}`;
}

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const key = cacheKey(from, to);
  const cached = rateCache[key];

  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.rate;
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    );
    const data = await response.json();
    const rate = data.rates?.[to];

    if (rate) {
      rateCache[key] = { rate, fetchedAt: Date.now() };
      rateCache[cacheKey(to, from)] = { rate: 1 / rate, fetchedAt: Date.now() };
      return rate;
    }

    throw new Error(`Rate not found for ${from} -> ${to}`);
  } catch {
    // Fallback to cached rate even if expired
    if (cached) return cached.rate;
    throw new Error(`Cannot get exchange rate for ${from} -> ${to}`);
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return amount * rate;
}
