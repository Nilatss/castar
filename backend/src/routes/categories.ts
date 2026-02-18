/**
 * CaStar — Category Routes (stub)
 *
 * GET    /categories          — List user categories
 * POST   /categories          — Create (tier limit: free <= 5 custom)
 * PUT    /categories/:id      — Update
 * DELETE /categories/:id      — Delete + reassign transactions
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const categories = new Hono<{ Bindings: Env; Variables: Variables }>();

categories.get('/', (c) => {
  const userId = c.get('userId');
  // TODO: SELECT from D1 WHERE user_id = userId ORDER BY sort_order
  return c.json({ ok: true, data: [], userId });
});

categories.post('/', async (c) => {
  // TODO: Check tier limit (free <= 5 custom), validate, INSERT
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

categories.put('/:id', async (c) => {
  const _id = c.req.param('id');
  // TODO: Validate ownership, UPDATE
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

categories.delete('/:id', (c) => {
  const _id = c.req.param('id');
  // TODO: Reassign transactions to "Other" category, DELETE
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { categories };
