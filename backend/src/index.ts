/**
 * CaStar — Backend API Entry Point
 * Cloudflare Workers + Hono + D1
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './types';
import { authMiddleware } from './middleware/auth';
import { auth } from './routes/auth';
import { transactions } from './routes/transactions';
import { categories } from './routes/categories';
import { budgets } from './routes/budgets';
import { recurrings } from './routes/recurrings';
import { settings } from './routes/settings';
import { sync } from './routes/sync';
import { voice } from './routes/voice';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── CORS ──
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ── Health check (also handles post-TG-logout redirect) ──
app.get('/', (c) => {
  // After Telegram logout, TG redirects to our origin root.
  // If we set a tg_switch cookie before the logout redirect, we know
  // the user is switching accounts → redirect them to the widget page.
  const cookie = c.req.header('cookie') || '';
  if (cookie.includes('tg_switch=1')) {
    c.header('Set-Cookie', 'tg_switch=; Path=/; Max-Age=0; SameSite=Lax');
    return c.redirect('/auth/telegram?bot=castar_bot&switch=1');
  }
  return c.json({ ok: true, service: 'castar-api', version: '1.0.0' });
});
app.get('/health', (c) => c.json({ ok: true }));

// ── Public routes (no auth required) ──
app.route('/auth', auth);
app.route('/api/voice', voice);

// ── Protected routes (JWT required) ──
app.use('/transactions/*', authMiddleware);
app.use('/categories/*', authMiddleware);
app.use('/budgets/*', authMiddleware);
app.use('/recurrings/*', authMiddleware);
app.use('/settings/*', authMiddleware);
app.use('/sync/*', authMiddleware);

app.route('/transactions', transactions);
app.route('/categories', categories);
app.route('/budgets', budgets);
app.route('/recurrings', recurrings);
app.route('/settings', settings);
app.route('/sync', sync);

// ── 404 ──
app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));

// ── Error handler ──
app.onError((err, c) => {
  console.error('[CaStar API Error]', err.message);
  return c.json({ ok: false, error: 'Internal server error' }, 500);
});

export default app;
