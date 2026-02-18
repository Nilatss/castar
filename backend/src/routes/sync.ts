/**
 * CaStar — Sync Route (stub)
 *
 * POST /sync — Bulk sync from client sync_queue
 * Accepts array of operations: { table, id, action, data }
 * Processes in order, returns results.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const sync = new Hono<{ Bindings: Env; Variables: Variables }>();

sync.post('/', async (c) => {
  // TODO: Accept array of sync_queue items from client
  // For each item:
  //   action === 'create' → INSERT
  //   action === 'update' → UPDATE
  //   action === 'delete' → DELETE
  // Return: { ok: true, processed: number, failed: number }
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { sync };
