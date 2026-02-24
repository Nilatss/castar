/**
 * Castar — Transaction Routes
 *
 * GET    /transactions          — List with filters (type, categoryId, dateFrom, dateTo, limit, offset)
 * POST   /transactions          — Create + adjust account balance
 * GET    /transactions/:id      — Get single
 * PUT    /transactions/:id      — Update
 * DELETE /transactions/:id      — Delete + revert account balance
 *
 * GET    /transactions/summary  — Aggregated totals (income, expense, net) for a period
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';

const transactions = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Validation ──

const createTransactionSchema = z.object({
  id: z.string().min(1),
  account_id: z.string().nullish(),
  category_id: z.string().nullish(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  description: z.string().max(500).nullish(),
  date: z.number().int().positive(),
  is_recurring: z.union([z.boolean(), z.number()]).transform((v) => (v ? 1 : 0)).default(0),
  recurring_id: z.string().nullish(),
  voice_input: z.union([z.boolean(), z.number()]).transform((v) => (v ? 1 : 0)).default(0),
});

const updateTransactionSchema = z.object({
  account_id: z.string().nullish(),
  category_id: z.string().nullish(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  description: z.string().max(500).nullish(),
  date: z.number().int().positive().optional(),
});

// ── Helpers ──

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

// ── Routes ──

/** GET /transactions/summary — Aggregated totals for a period */
transactions.get('/summary', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  const dateFrom = c.req.query('date_from');
  const dateTo = c.req.query('date_to');

  let sql = 'SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (dateFrom) { sql += ' AND date >= ?'; params.push(Number(dateFrom)); }
  if (dateTo) { sql += ' AND date <= ?'; params.push(Number(dateTo)); }

  sql += ' GROUP BY type';

  const { results } = await db.prepare(sql).bind(...params).all<{ type: string; total: number }>();

  const summary = { income: 0, expense: 0, net: 0 };
  for (const row of results) {
    if (row.type === 'income') summary.income = row.total;
    else if (row.type === 'expense') summary.expense = row.total;
  }
  summary.net = summary.income - summary.expense;

  return c.json({ ok: true, data: summary });
});

/** GET /transactions — List with filters */
transactions.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const type = c.req.query('type');
  const categoryId = c.req.query('category_id');
  const dateFrom = c.req.query('date_from');
  const dateTo = c.req.query('date_to');
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200);
  const offset = Number(c.req.query('offset')) || 0;

  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (categoryId) { sql += ' AND category_id = ?'; params.push(categoryId); }
  if (dateFrom) { sql += ' AND date >= ?'; params.push(Number(dateFrom)); }
  if (dateTo) { sql += ' AND date <= ?'; params.push(Number(dateTo)); }

  sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await db.prepare(sql).bind(...params).all();

  return c.json({ ok: true, data: results });
});

/** POST /transactions — Create a transaction */
transactions.post('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, currency, description, date, is_recurring, recurring_id, voice_input, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.id, userId, data.account_id ?? null, data.category_id ?? null,
      data.type, data.amount, data.currency, data.description ?? null,
      data.date, data.is_recurring, data.recurring_id ?? null, data.voice_input,
      now, now,
    )
    .run();

  // Adjust account balance
  await adjustBalance(db, data.account_id, data.type, data.amount);

  return c.json({ ok: true, data: { id: data.id } }, 201);
});

/** GET /transactions/:id — Get a single transaction */
transactions.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  const row = await db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();

  if (!row) return c.json({ ok: false, error: 'Transaction not found' }, 404);
  return c.json({ ok: true, data: row });
});

/** PUT /transactions/:id — Update a transaction */
transactions.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  const existing = await db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ account_id: string | null; type: string; amount: number }>();

  if (!existing) return c.json({ ok: false, error: 'Transaction not found' }, 404);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  // If amount or type changed, revert old balance and apply new
  const amountChanged = data.amount !== undefined && data.amount !== existing.amount;
  const typeChanged = data.type !== undefined && data.type !== existing.type;

  if (amountChanged || typeChanged) {
    // Revert old
    await adjustBalance(db, existing.account_id, existing.type, existing.amount, true);
    // Apply new
    await adjustBalance(
      db,
      data.account_id !== undefined ? (data.account_id ?? null) : existing.account_id,
      data.type ?? existing.type,
      data.amount ?? existing.amount,
    );
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.account_id !== undefined) { sets.push('account_id = ?'); values.push(data.account_id ?? null); }
  if (data.category_id !== undefined) { sets.push('category_id = ?'); values.push(data.category_id ?? null); }
  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.currency !== undefined) { sets.push('currency = ?'); values.push(data.currency); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description ?? null); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }

  if (sets.length === 0) return c.json({ ok: true, data: { id } });

  sets.push('updated_at = ?');
  values.push(now, id, userId);

  await db
    .prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  return c.json({ ok: true, data: { id } });
});

/** DELETE /transactions/:id — Delete a transaction + revert balance */
transactions.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  const existing = await db
    .prepare('SELECT account_id, type, amount FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ account_id: string | null; type: string; amount: number }>();

  if (!existing) return c.json({ ok: false, error: 'Transaction not found' }, 404);

  // Revert account balance
  await adjustBalance(db, existing.account_id, existing.type, existing.amount, true);

  await db
    .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  return c.json({ ok: true });
});

export { transactions };
