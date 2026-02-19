/**
 * CaStar — Auth Routes
 *
 * Endpoints (matches client expectations from config.ts):
 * GET  /auth/telegram        — Telegram Login Widget page
 * POST /auth/email/send-code — Send 4-digit code via Resend.com
 * POST /auth/email/verify-code — Verify code, return JWT
 * POST /auth/phone/send-code — Send 4-digit code via Eskiz.uz
 * POST /auth/phone/verify-code — Verify code, return JWT
 *
 * TODO: Implement real logic (OTP storage in D1, validation, JWT signing)
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getTelegramWidgetHtml } from '../services/telegram';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /auth/telegram — serve Telegram Login Widget
auth.get('/telegram', (c) => {
  const bot = c.req.query('bot') || 'castar_bot';
  const callbackUrl = `${new URL(c.req.url).origin}/auth/telegram/callback`;
  const html = getTelegramWidgetHtml(bot, callbackUrl);
  return c.html(html);
});

// GET /auth/telegram/callback — handle Telegram widget callback
auth.get('/telegram/callback', (c) => {
  // TODO: Validate hash, find/create user, sign JWT, redirect to deep link
  // const params = Object.fromEntries(new URL(c.req.url).searchParams);
  // const valid = await validateTelegramAuth(params, c.env.TELEGRAM_BOT_TOKEN);
  // const jwt = await signJwt(userId, c.env.JWT_SECRET);
  // redirect to castar://auth/callback?token=${jwt}&user=${JSON.stringify(user)}
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

// POST /auth/email/send-code
auth.post('/email/send-code', async (c) => {
  // TODO: Validate email, generate 4-digit code, store in D1, send via Resend
  // const { email } = await c.req.json();
  // Rate limit: 1 code per 60 seconds per email
  // OTP expires in 5 minutes, max 3 attempts
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

// POST /auth/email/verify-code
auth.post('/email/verify-code', async (c) => {
  // TODO: Validate code against D1, find/create user, sign JWT
  // const { email, code } = await c.req.json();
  // Check attempts <= 3, check expires_at > now
  // Return: { ok: true, token: jwt, email }
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

// POST /auth/phone/send-code
auth.post('/phone/send-code', async (c) => {
  // TODO: Validate phone, generate 4-digit code, store in D1, send via Eskiz
  // const { phone } = await c.req.json();
  // Rate limit: 1 code per 60 seconds per phone
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

// POST /auth/phone/verify-code
auth.post('/phone/verify-code', async (c) => {
  // TODO: Validate code against D1, find/create user, sign JWT
  // const { phone, code } = await c.req.json();
  // Return: { ok: true, token: jwt, phone }
  return c.json({ ok: false, error: 'Not implemented' }, 501);
});

export { auth };
