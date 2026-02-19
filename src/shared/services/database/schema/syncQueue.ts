import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const syncQueue = sqliteTable(
  'sync_queue',
  {
    id: text('id').primaryKey(),
    tableName: text('table_name').notNull(),
    recordId: text('record_id').notNull(),
    action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
    data: text('data').notNull(),
    createdAt: integer('created_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => [index('idx_sync_queue_pending').on(table.attempts)]
);
