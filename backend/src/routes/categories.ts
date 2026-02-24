/**
 * Castar — Category Routes
 *
 * GET    /categories          — List user categories
 * POST   /categories          — Create (tier limit: free ≤ 5 custom)
 * PUT    /categories/:id      — Update
 * DELETE /categories/:id      — Delete + reassign transactions to uncategorized
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';

const categories = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Validation ──

const createCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  icon: z.string().default('📁'),
  color: z.string().default('#808080'),
  type: z.enum(['income', 'expense']),
  is_default: z.union([z.boolean(), z.number()]).transform((v) => (v ? 1 : 0)).default(0),
  sort_order: z.number().int().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  sort_order: z.number().int().optional(),
});

// ── Routes ──

/** GET /categories — List all user categories ordered by sort_order */
categories.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const { results } = await db
    .prepare(
      'SELECT id, user_id, name, icon, color, type, is_default, sort_order, created_at, updated_at FROM categories WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC',
    )
    .bind(userId)
    .all();

  return c.json({ ok: true, data: results });
});

/** POST /categories — Create a new category */
categories.post('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  // Tier limit: free users ≤ 20 custom categories
  const countResult = await db
    .prepare('SELECT COUNT(*) as cnt FROM categories WHERE user_id = ? AND is_default = 0')
    .bind(userId)
    .first<{ cnt: number }>();

  if (countResult && countResult.cnt >= 20) {
    return c.json({ ok: false, error: 'Category limit reached (max 20 custom)' }, 403);
  }

  await db
    .prepare(
      'INSERT INTO categories (id, user_id, name, icon, color, type, is_default, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(data.id, userId, data.name, data.icon, data.color, data.type, data.is_default, data.sort_order, now, now)
    .run();

  return c.json({ ok: true, data: { id: data.id } }, 201);
});

/** PUT /categories/:id — Update a category */
categories.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  // Verify ownership
  const existing = await db
    .prepare('SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ id: string; is_default: number }>();

  if (!existing) return c.json({ ok: false, error: 'Category not found' }, 404);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false, error: 'Invalid JSON body' }, 400);

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, 400);
  }

  const data = parsed.data;
  const now = Date.now();

  // Build dynamic SET clause
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.icon !== undefined) { sets.push('icon = ?'); values.push(data.icon); }
  if (data.color !== undefined) { sets.push('color = ?'); values.push(data.color); }
  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.sort_order !== undefined) { sets.push('sort_order = ?'); values.push(data.sort_order); }

  if (sets.length === 0) return c.json({ ok: true, data: { id } });

  sets.push('updated_at = ?');
  values.push(now, id, userId);

  await db
    .prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  return c.json({ ok: true, data: { id } });
});

/** DELETE /categories/:id — Delete a category, nullify transactions */
categories.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = c.env.DB;

  // Verify ownership
  const existing = await db
    .prepare('SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ id: string; is_default: number }>();

  if (!existing) return c.json({ ok: false, error: 'Category not found' }, 404);
  if (existing.is_default) return c.json({ ok: false, error: 'Cannot delete default category' }, 400);

  // Nullify category_id on transactions that used this category
  await db.batch([
    db.prepare('UPDATE transactions SET category_id = NULL, updated_at = ? WHERE category_id = ? AND user_id = ?').bind(Date.now(), id, userId),
    db.prepare('UPDATE budgets SET category_id = NULL, updated_at = ? WHERE category_id = ? AND user_id = ?').bind(Date.now(), id, userId),
    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').bind(id, userId),
  ]);

  return c.json({ ok: true });
});

export { categories };
