/**
 * CaStar — Transaction Routes (stub)
 *
 * GET    /transactions          — List with filters
 * POST   /transactions          — Create
 * GET    /transactions/:id      — Get by ID
 * PUT    /transactions/:id      — Update
 * DELETE /transactions/:id      — Delete
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const transactions = new Hono<{ Bindings: Env; Variables: Variables }>();

transactions.get('/', (c) => {
  const userId = c.get('userId');
  // TODO: SELECT from D1 with filters (type, categoryId, dateFrom, dateTo, limit, offset)
  return c.json({ ok: true, data: [], userId });
});

transactions.post('/', async (c) => {
  // TODO: Validate body with Zod, INSERT into D1, adjust account balance
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

transactions.get('/:id', (c) => {
  const _id = c.req.param('id');
  // TODO: SELECT by id WHERE user_id = userId
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

transactions.put('/:id', async (c) => {
  const _id = c.req.param('id');
  // TODO: Validate body, UPDATE in D1
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

transactions.delete('/:id', (c) => {
  const _id = c.req.param('id');
  // TODO: DELETE from D1, revert account balance
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { transactions };
