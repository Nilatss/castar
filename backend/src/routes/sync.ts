/**
 * Castar — Sync Routes
 *
 * POST /sync/push     — Bulk push from client sync_queue → D1
 * POST /sync/pull     — Pull server changes since last_synced_at
 * POST /sync/full     — Push + pull in one request
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';

const sync = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Validation ──

const ALLOWED_TABLES = ['categories', 'accounts', 'transactions', 'budgets', 'recurrings'] as const;
type TableName = (typeof ALLOWED_TABLES)[number];

const syncOperationSchema = z.object({
  table: z.enum(ALLOWED_TABLES),
  record_id: z.string().min(1),
  action: z.enum(['create', 'update', 'delete']),
  data: z.record(z.string(), z.unknown()).optional(), // required for create/update, ignored for delete
});

const pushSchema = z.object({
  operations: z.array(syncOperationSchema).min(1).max(500),
});

const pullSchema = z.object({
  last_synced_at: z.number().int().min(0),
  tables: z.array(z.enum(ALLOWED_TABLES)).optional(), // if omitted, pull all tables
});

const fullSyncSchema = z.object({
  operations: z.array(syncOperationSchema).max(500).default([]),
  last_synced_at: z.number().int().min(0).default(0),
  tables: z.array(z.enum(ALLOWED_TABLES)).optional(),
});

// ── Allowed columns per table (whitelist to prevent injection) ──

const TABLE_COLUMNS: Record<TableName, readonly string[]> = {
  categories: ['id', 'user_id', 'name', 'icon', 'color', 'type', 'is_default', 'sort_order', 'created_at', 'updated_at'],
  accounts: ['id', 'user_id', 'name', 'type', 'currency', 'balance', 'icon', 'color', 'is_archived', 'created_at', 'updated_at'],
  transactions: ['id', 'user_id', 'account_id', 'category_id', 'type', 'amount', 'currency', 'description', 'date', 'is_recurring', 'recurring_id', 'voice_input', 'created_at', 'updated_at'],
  budgets: ['id', 'user_id', 'category_id', 'name', 'amount', 'currency', 'period', 'start_date', 'is_active', 'created_at', 'updated_at'],
  recurrings: ['id', 'user_id', 'account_id', 'category_id', 'type', 'amount', 'currency', 'description', 'frequency', 'next_date', 'is_active', 'created_at', 'updated_at'],
};

// Columns that clients cannot set (always forced server-side)
const PROTECTED_COLUMNS = new Set(['user_id']);

// ── Helpers ──

interface OpResult {
  record_id: string;
  table: string;
  action: string;
  ok: boolean;
  error?: string;
}

/** Adjust account balance: +amount for income, -amount for expense */
async function adjustBalance(db: D1Database, accountId: string | null | undefined, type: string, amount: number, revert = false) {
  if (!accountId) return;
  const sign = type === 'income' ? 1 : -1;
  const delta = revert ? -sign * amount : sign * amount;
  await db
    .prepare('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?')
    .bind(delta, Date.now(), accountId)
    .run();
}

/** Process a single create operation: INSERT OR REPLACE */
async function processCreate(
  db: D1Database, userId: string, table: TableName, recordId: string, data: Record<string, unknown>,
): Promise<OpResult> {
  const allowed = TABLE_COLUMNS[table];
  const now = Date.now();

  // Build column/value pairs, only allowing whitelisted columns
  const cols: string[] = [];
  const vals: unknown[] = [];

  for (const col of allowed) {
    if (col === 'user_id') {
      cols.push(col);
      vals.push(userId); // always force to authenticated user
    } else if (col === 'id') {
      cols.push(col);
      vals.push(recordId);
    } else if (col === 'created_at' && data[col] != null) {
      cols.push(col);
      vals.push(data[col]);
    } else if (col === 'updated_at') {
      cols.push(col);
      vals.push(data[col] ?? now);
    } else if (data[col] !== undefined) {
      cols.push(col);
      vals.push(data[col] ?? null);
    }
  }

  // Ensure required columns
  if (!cols.includes('created_at')) {
    cols.push('created_at');
    vals.push(now);
  }
  if (!cols.includes('updated_at')) {
    cols.push('updated_at');
    vals.push(now);
  }

  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;

  await db.prepare(sql).bind(...vals).run();

  // Adjust account balance for transaction creates
  if (table === 'transactions' && data.account_id && data.type && data.amount) {
    await adjustBalance(db, data.account_id as string, data.type as string, data.amount as number);
  }

  return { record_id: recordId, table, action: 'create', ok: true };
}

/** Process a single update operation */
async function processUpdate(
  db: D1Database, userId: string, table: TableName, recordId: string, data: Record<string, unknown>,
): Promise<OpResult> {
  const allowed = TABLE_COLUMNS[table];
  const now = Date.now();

  // For transactions, check if amount/type changed for balance adjustment
  let existingTx: { account_id: string | null; type: string; amount: number } | null = null;
  if (table === 'transactions' && (data.amount !== undefined || data.type !== undefined)) {
    existingTx = await db
      .prepare('SELECT account_id, type, amount FROM transactions WHERE id = ? AND user_id = ?')
      .bind(recordId, userId)
      .first<{ account_id: string | null; type: string; amount: number }>();
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const col of allowed) {
    if (PROTECTED_COLUMNS.has(col) || col === 'id' || col === 'created_at') continue;
    if (col === 'updated_at') continue; // handled separately
    if (data[col] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(data[col] ?? null);
    }
  }

  if (sets.length === 0) {
    return { record_id: recordId, table, action: 'update', ok: true };
  }

  sets.push('updated_at = ?');
  values.push(data.updated_at ?? now);
  values.push(recordId, userId);

  await db.prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).bind(...values).run();

  // Adjust balance for transaction amount/type changes
  if (table === 'transactions' && existingTx) {
    const newAmount = (data.amount as number) ?? existingTx.amount;
    const newType = (data.type as string) ?? existingTx.type;
    const amountChanged = data.amount !== undefined && data.amount !== existingTx.amount;
    const typeChanged = data.type !== undefined && data.type !== existingTx.type;

    if (amountChanged || typeChanged) {
      await adjustBalance(db, existingTx.account_id, existingTx.type, existingTx.amount, true);
      const newAccountId = data.account_id !== undefined ? (data.account_id as string) : existingTx.account_id;
      await adjustBalance(db, newAccountId, newType, newAmount);
    }
  }

  return { record_id: recordId, table, action: 'update', ok: true };
}

/** Process a single delete operation */
async function processDelete(
  db: D1Database, userId: string, table: TableName, recordId: string,
): Promise<OpResult> {
  // For transactions, revert balance before deleting
  if (table === 'transactions') {
    const existing = await db
      .prepare('SELECT account_id, type, amount FROM transactions WHERE id = ? AND user_id = ?')
      .bind(recordId, userId)
      .first<{ account_id: string | null; type: string; amount: number }>();

    if (existing) {
      await adjustBalance(db, existing.account_id, existing.type, existing.amount, true);
    }
  }

  // For categories, nullify refs before deleting
  if (table === 'categories') {
    await db.prepare('UPDATE transactions SET category_id = NULL, updated_at = ? WHERE category_id = ? AND user_id = ?')
      .bind(Date.now(), recordId, userId).run();
    await db.prepare('UPDATE budgets SET category_id = NULL, updated_at = ? WHERE category_id = ? AND user_id = ?')
      .bind(Date.now(), recordId, userId).run();
  }

  // Soft delete for accounts and budgets, hard delete for others
  if (table === 'accounts') {
    await db.prepare('UPDATE accounts SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(Date.now(), recordId, userId).run();
  } else if (table === 'budgets') {
    await db.prepare('UPDATE budgets SET is_active = 0, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(Date.now(), recordId, userId).run();
  } else {
    await db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`)
      .bind(recordId, userId).run();
  }

  return { record_id: recordId, table, action: 'delete', ok: true };
}

/** Pull changes from a single table since timestamp */
async function pullTable(db: D1Database, userId: string, table: TableName, since: number) {
  const { results } = await db
    .prepare(`SELECT * FROM ${table} WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`)
    .bind(userId, since)
    .all();
  return results;
}

// ── Routes ──

/** POST /sync/push — Bulk push operations from client */
sync.post('/push', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = pushSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { operations } = parsed.data;
  const results: OpResult[] = [];
  let processed = 0;
  let failed = 0;

  for (const op of operations) {
    try {
      let result: OpResult;

      switch (op.action) {
        case 'create':
          if (!op.data) throw new Error('Data required for create');
          result = await processCreate(db, userId, op.table, op.record_id, op.data as Record<string, unknown>);
          break;
        case 'update':
          if (!op.data) throw new Error('Data required for update');
          result = await processUpdate(db, userId, op.table, op.record_id, op.data as Record<string, unknown>);
          break;
        case 'delete':
          result = await processDelete(db, userId, op.table, op.record_id);
          break;
      }

      results.push(result);
      processed++;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      results.push({ record_id: op.record_id, table: op.table, action: op.action, ok: false, error });
      failed++;
    }
  }

  return c.json({
    ok: true,
    data: { processed, failed, results },
    server_time: Date.now(),
  });
});

/** POST /sync/pull — Pull server changes since last_synced_at */
sync.post('/pull', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = pullSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { last_synced_at, tables } = parsed.data;
  const tablesToPull = tables ?? [...ALLOWED_TABLES];

  const changes: Record<string, unknown[]> = {};
  let totalChanges = 0;

  for (const table of tablesToPull) {
    const rows = await pullTable(db, userId, table, last_synced_at);
    changes[table] = rows;
    totalChanges += rows.length;
  }

  return c.json({
    ok: true,
    data: {
      changes,
      total_changes: totalChanges,
      server_time: Date.now(),
    },
  });
});

/** POST /sync/full — Push local changes + pull server changes in one request */
sync.post('/full', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = fullSyncSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const { operations, last_synced_at, tables } = parsed.data;

  // Phase 1: Push local changes to server
  const pushResults: OpResult[] = [];
  let processed = 0;
  let failed = 0;

  for (const op of operations) {
    try {
      let result: OpResult;

      switch (op.action) {
        case 'create':
          if (!op.data) throw new Error('Data required for create');
          result = await processCreate(db, userId, op.table, op.record_id, op.data as Record<string, unknown>);
          break;
        case 'update':
          if (!op.data) throw new Error('Data required for update');
          result = await processUpdate(db, userId, op.table, op.record_id, op.data as Record<string, unknown>);
          break;
        case 'delete':
          result = await processDelete(db, userId, op.table, op.record_id);
          break;
      }

      pushResults.push(result);
      processed++;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      pushResults.push({ record_id: op.record_id, table: op.table, action: op.action, ok: false, error });
      failed++;
    }
  }

  // Phase 2: Pull server changes
  const tablesToPull = tables ?? [...ALLOWED_TABLES];
  const changes: Record<string, unknown[]> = {};
  let totalChanges = 0;

  for (const table of tablesToPull) {
    const rows = await pullTable(db, userId, table, last_synced_at);
    changes[table] = rows;
    totalChanges += rows.length;
  }

  return c.json({
    ok: true,
    data: {
      push: { processed, failed, results: pushResults },
      pull: { changes, total_changes: totalChanges },
      server_time: Date.now(),
    },
  });
});

export { sync };
