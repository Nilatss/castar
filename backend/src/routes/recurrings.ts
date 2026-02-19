/**
 * CaStar — Recurring Transaction Routes (stub)
 *
 * GET    /recurrings           — List
 * POST   /recurrings           — Create
 * PUT    /recurrings/:id       — Update
 * PATCH  /recurrings/:id/pause — Toggle pause/resume
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const recurrings = new Hono<{ Bindings: Env; Variables: Variables }>();

recurrings.get('/', (c) => {
  const userId = c.get('userId');
  // TODO: SELECT from D1 WHERE user_id = userId
  return c.json({ ok: true, data: [], userId });
});

recurrings.post('/', async (c) => {
  // TODO: Validate body, INSERT
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

recurrings.put('/:id', async (c) => {
  const _id = c.req.param('id');
  // TODO: Validate ownership, UPDATE
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

recurrings.patch('/:id/pause', (c) => {
  const _id = c.req.param('id');
  // TODO: Toggle is_active
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { recurrings };
