import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const exchangeRates = sqliteTable('exchange_rates', {
  id: text('id').primaryKey(),
  baseCurrency: text('base_currency').notNull(),
  targetCurrency: text('target_currency').notNull(),
  rate: real('rate').notNull(),
  fetchedAt: integer('fetched_at').notNull(),
});
