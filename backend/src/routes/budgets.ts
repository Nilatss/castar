/**
 * CaStar — Budget Routes (stub)
 *
 * GET    /budgets          — List active (enriched: spent, remaining, %)
 * POST   /budgets          — Create
 * PUT    /budgets/:id      — Update limit/period
 * DELETE /budgets/:id      — Deactivate (soft delete)
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const budgets = new Hono<{ Bindings: Env; Variables: Variables }>();

budgets.get('/', (c) => {
  const userId = c.get('userId');
  // TODO: SELECT active budgets, enrich with spent amount from transactions
  return c.json({ ok: true, data: [], userId });
});

budgets.post('/', async (c) => {
  // TODO: Validate body, INSERT with is_active = 1
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

budgets.put('/:id', async (c) => {
  const _id = c.req.param('id');
  // TODO: Validate ownership, UPDATE
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

budgets.delete('/:id', (c) => {
  const _id = c.req.param('id');
  // TODO: Soft delete: UPDATE SET is_active = 0
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { budgets };
