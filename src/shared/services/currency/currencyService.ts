/**
 * Castar — Currency conversion service
 *
 * Uses open.er-api.com (free, no API key, 160+ currencies including UZS).
 * Rates cached via expo-secure-store for 24 hours; hardcoded fallback for offline.
 */

import * as SecureStore from 'expo-secure-store';

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORE_KEY = 'castar_exchange_rates';

/**
 * Hardcoded fallback rates (units of X per 1 USD).
 * Used ONLY when API unreachable AND SecureStore empty (first-ever launch offline).
 */
const FALLBACK_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  UZS: 12850,
  EUR: 0.925,
  RUB: 93.5,
  GBP: 0.79,
  TRY: 38.5,
  KZT: 510,
  CNY: 7.26,
  JPY: 149.5,
  KRW: 1365,
  CHF: 0.88,
  AED: 3.67,
  INR: 84,
  BRL: 5.75,
  CAD: 1.4,
  AUD: 1.57,
  PLN: 3.84,
  UAH: 41.5,
  GEL: 2.74,
  BYN: 3.27,
  AZN: 1.7,
  AMD: 389,
  KGS: 86.8,
  TJS: 10.9,
  MDL: 17.85,
  TMT: 3.5,
};

/** Currencies we care about (subset of API response to keep storage small). */
const SUPPORTED_CODES = new Set(Object.keys(FALLBACK_RATES_FROM_USD));

// ═══════════════════════════════════════════════
// In-memory cache
// ═══════════════════════════════════════════════

interface CacheEntry {
  rates: Record<string, number>;
  fetchedAt: number;
}

let memoryCache: CacheEntry | null = null;

// ═══════════════════════════════════════════════
// SecureStore persistence helpers
// ═══════════════════════════════════════════════

async function loadCachedRates(): Promise<CacheEntry | null> {
  try {
    const json = await SecureStore.getItemAsync(STORE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json) as CacheEntry;
    if (parsed && parsed.rates && typeof parsed.fetchedAt === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveCachedRates(entry: CacheEntry): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore write errors
  }
}

// ═══════════════════════════════════════════════
// Core API
// ═══════════════════════════════════════════════

/**
 * Returns a map of currency codes → rate relative to USD.
 * Example: { UZS: 12850, EUR: 0.925, USD: 1, ... }
 *
 * Resolution order:
 *   1. In-memory cache (< 24h)
 *   2. SecureStore cache (< 24h)
 *   3. API fetch → save to SecureStore + memory
 *   4. Stale SecureStore (any age)
 *   5. Hardcoded fallback
 */
export async function getRatesFromUSD(): Promise<Record<string, number>> {
  const now = Date.now();

  // 1. Memory cache (fresh)
  if (memoryCache && now - memoryCache.fetchedAt < CACHE_DURATION_MS) {
    return memoryCache.rates;
  }

  // 2. SecureStore cache (fresh)
  const stored = await loadCachedRates();
  if (stored && now - stored.fetchedAt < CACHE_DURATION_MS) {
    memoryCache = stored;
    return stored.rates;
  }

  // 3. API fetch
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const apiRates: Record<string, number> | undefined = data?.rates;

    if (apiRates && typeof apiRates === 'object') {
      // Keep only our supported currencies to minimize storage
      const map: Record<string, number> = { USD: 1 };
      for (const [code, rate] of Object.entries(apiRates)) {
        if (typeof rate === 'number' && rate > 0 && SUPPORTED_CODES.has(code)) {
          map[code] = rate;
        }
      }

      const entry: CacheEntry = { rates: map, fetchedAt: now };
      memoryCache = entry;
      // Save to SecureStore in background
      saveCachedRates(entry);
      return map;
    }

    throw new Error('Invalid API response');
  } catch {
    // API failed
  }

  // 4. Stale SecureStore (any age)
  if (stored) {
    memoryCache = stored;
    return stored.rates;
  }

  // 5. Hardcoded fallback
  const fallback: CacheEntry = { rates: { ...FALLBACK_RATES_FROM_USD }, fetchedAt: 0 };
  memoryCache = fallback;
  return fallback.rates;
}

/**
 * Get exchange rate for a specific pair.
 * rate(X → Y) = rateUSD→Y / rateUSD→X
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const rates = await getRatesFromUSD();
  const fromRate = rates[from];
  const toRate = rates[to];

  if (fromRate && toRate) {
    return toRate / fromRate;
  }

  throw new Error(`Rate not found for ${from} -> ${to}`);
}

/**
 * Convert an amount between currencies.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return amount * rate;
}

/**
 * Force refresh rates from API (ignores cache age).
 */
export async function forceRefreshRates(): Promise<Record<string, number>> {
  memoryCache = null;
  try {
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // ignore
  }
  return getRatesFromUSD();
}
