/**
 * CaStar — User Settings Routes (stub)
 *
 * GET /settings — Get current settings
 * PUT /settings — Update (language, currency, display_name)
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const settings = new Hono<{ Bindings: Env; Variables: Variables }>();

settings.get('/', (c) => {
  const userId = c.get('userId');
  // TODO: SELECT language, primary_currency, display_name FROM users WHERE id = userId
  return c.json({ ok: true, data: { language: 'uz', currency: 'UZS' }, userId });
});

settings.put('/', async (c) => {
  // TODO: Validate body, UPDATE users SET language, primary_currency, display_name
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { settings };
