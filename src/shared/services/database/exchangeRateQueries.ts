import { eq, and, gte } from 'drizzle-orm';
import { db } from './connection';
import { exchangeRates } from './schema';

type ExchangeRate = typeof exchangeRates.$inferSelect;
type NewExchangeRate = typeof exchangeRates.$inferInsert;

/** All stored rates. */
export function findAll(): ExchangeRate[] {
  return db.select().from(exchangeRates).all();
}

/** All rates with a given base currency. */
export function findByBase(base: string): ExchangeRate[] {
  return db
    .select()
    .from(exchangeRates)
    .where(eq(exchangeRates.baseCurrency, base))
    .all();
}

/**
 * Rates from `base` that were fetched within the last `maxAgeMs` milliseconds.
 * Returns empty array if everything is stale or missing.
 */
export function findFreshByBase(base: string, maxAgeMs: number): ExchangeRate[] {
  const cutoff = Date.now() - maxAgeMs;
  return db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, base),
        gte(exchangeRates.fetchedAt, cutoff),
      ),
    )
    .all();
}

/**
 * Insert or replace a batch of exchange rate rows.
 * Uses SQLite INSERT OR REPLACE (id is PK).
 */
export function upsertBatch(rates: NewExchangeRate[]): void {
  if (rates.length === 0) return;
  // Drizzle supports onConflictDoUpdate; use it for upsert
  for (const rate of rates) {
    db.insert(exchangeRates)
      .values(rate)
      .onConflictDoUpdate({
        target: exchangeRates.id,
        set: {
          rate: rate.rate,
          fetchedAt: rate.fetchedAt,
        },
      })
      .run();
  }
}

/** Remove all exchange rate records. */
export function deleteAll(): void {
  db.delete(exchangeRates).run();
}
