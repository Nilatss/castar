/**
 * Castar — Auth Routes
 *
 * Endpoints (matches client expectations from config.ts):
 * GET  /auth/telegram          — Telegram Login Widget page
 * GET  /auth/telegram/callback — Validate HMAC-SHA256 hash, sign JWT, redirect to deep link
 * POST /auth/email/send-code   — Send 4-digit code via Resend.com
 * POST /auth/email/verify-code — Verify code, return JWT
 * POST /auth/phone/send-code   — Send 4-digit code via Eskiz.uz
 * POST /auth/phone/verify-code — Verify code, return JWT
 *
 * TODO: Email/Phone OTP (Resend + Eskiz) — needs D1 for code storage
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getTelegramWidgetHtml, validateTelegramAuth } from '../services/telegram';
import { signJwt } from '../services/jwt';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /auth/telegram — serve Telegram Login Widget
auth.get('/telegram', (c) => {
  const bot = c.req.query('bot') || 'castar_bot';
  const callbackUrl = `${new URL(c.req.url).origin}/auth/telegram/callback`;
  const html = getTelegramWidgetHtml(bot, callbackUrl);
  return c.html(html);
});

// GET /auth/telegram/callback — handle Telegram widget callback
auth.get('/telegram/callback', async (c) => {
  // 1. Extract all query params from Telegram widget redirect
  const url = new URL(c.req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // 2. Validate HMAC-SHA256 hash + auth_date freshness
  const isValid = await validateTelegramAuth(params, c.env.TELEGRAM_BOT_TOKEN);

  if (!isValid) {
    return c.json({ ok: false, error: 'Invalid Telegram auth data' }, 403);
  }

  // 3. Build user object matching client TelegramUser shape
  const telegramUser = {
    id: params['id'] || '',
    first_name: params['first_name'] || '',
    last_name: params['last_name'] || '',
    username: params['username'] || '',
    photo_url: params['photo_url'] || '',
  };

  // 4. Use Telegram user ID as the userId for JWT
  const userId = `tg_${telegramUser.id}`;

  // 5. Sign JWT (30 days expiry)
  const token = await signJwt(userId, c.env.JWT_SECRET);

  // 6. Redirect to deep link: castar://auth/callback?token=...&user=...
  const userJson = encodeURIComponent(JSON.stringify(telegramUser));
  const deepLink = `castar://auth/callback?token=${token}&user=${userJson}`;

  return c.redirect(deepLink, 302);
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
