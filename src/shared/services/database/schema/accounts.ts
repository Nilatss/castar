import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'card', 'bank', 'savings'] }).notNull(),
  currency: text('currency').notNull().default('UZS'),
  balance: real('balance').notNull().default(0),
  icon: text('icon'),
  color: text('color'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  syncedAt: integer('synced_at'),
});
