/**
 * Castar — Budget Routes
 *
 * GET    /budgets          — List active budgets (enriched with spent/remaining/%)
 * POST   /budgets          — Create
 * PUT    /budgets/:id      — Update limit/period
 * DELETE /budgets/:id      — Deactivate (soft delete: is_active = 0)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';

const budgets = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Validation ──

const createBudgetSchema = z.object({
  id: z.string().min(1),
  category_id: z.string().nullish(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('UZS'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.number().int().positive(),
});

const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  category_id: z.string().nullish(),
  start_date: z.number().int().positive().optional(),
});

// ── Helpers ──

/** Calculate current period start timestamp for a budget */
function getPeriodStart(period: string): number {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    case 'weekly': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff).getTime();
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1).getTime();
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
}

// ── Routes ──

/** GET /budgets — List active budgets enriched with spent data */
budgets.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  const includeInactive = c.req.query('include_inactive') === '1';

  const sql = includeInactive
    ? 'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM budgets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC';

  const { results: rows } = await db.prepare(sql).bind(userId).all<{
    id: string; user_id: string; category_id: string | null; name: string;
    amount: number; currency: string; period: string; start_date: number;
    is_active: number; created_at: number; updated_at: number;
  }>();

  // Enrich each budget with spent amount from transactions in current period
  const enriched = await Promise.all(
    rows.map(async (budget) => {
      const periodStart = getPeriodStart(budget.period);
      const now = Date.now();

      let spentSql = 'SELECT COALESCE(SUM(amount), 0) as spent FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?';
      const params: unknown[] = [userId, 'expense', periodStart, now];

      if (budget.category_id) {
        spentSql += ' AND category_id = ?';
        params.push(budget.category_id);
      }

      const row = await db.prepare(spentSql).bind(...params).first<{ spent: number }>();
      const spent = row?.spent ?? 0;
      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 10000) / 100) : 0;

      return { ...budget, spent, remaining, percentage, period_start: periodStart };
    }),
  );

  return c.json({ ok: true, data: enriched });
});

/** POST /budgets — Create a new budget */
budgets.post('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = createBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  await db
    .prepare(
      'INSERT INTO budgets (id, user_id, category_id, name, amount, currency, period, start_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
    )
    .bind(data.id, userId, data.category_id ?? null, data.name, data.amount, data.currency, data.period, data.start_date, now, now)
    .run();

  return c.json({ ok: true, data: { id: data.id } }, 201);
});

/** PUT /budgets/:id — Update a budget */
budgets.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  const existing = await db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!existing) return c.json({ ok: false, error: 'Budget not found' }, 404);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = updateBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.amount !== undefined) { sets.push('amount = ?'); values.push(data.amount); }
  if (data.currency !== undefined) { sets.push('currency = ?'); values.push(data.currency); }
  if (data.period !== undefined) { sets.push('period = ?'); values.push(data.period); }
  if (data.category_id !== undefined) { sets.push('category_id = ?'); values.push(data.category_id ?? null); }
  if (data.start_date !== undefined) { sets.push('start_date = ?'); values.push(data.start_date); }

  if (sets.length === 0) return c.json({ ok: true, data: { id } });

  sets.push('updated_at = ?');
  values.push(now, id, userId);

  await db.prepare(`UPDATE budgets SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).bind(...values).run();
  return c.json({ ok: true, data: { id } });
});

/** DELETE /budgets/:id — Soft delete (deactivate) */
budgets.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  const existing = await db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!existing) return c.json({ ok: false, error: 'Budget not found' }, 404);

  await db.prepare('UPDATE budgets SET is_active = 0, updated_at = ? WHERE id = ? AND user_id = ?').bind(Date.now(), id, userId).run();
  return c.json({ ok: true });
});

export { budgets };
