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

  console.log('[Telegram Callback] Params:', JSON.stringify(params));

  // 2. Validate HMAC-SHA256 hash + auth_date freshness
  const isValid = await validateTelegramAuth(params, c.env.TELEGRAM_BOT_TOKEN);

  if (!isValid) {
    console.log('[Telegram Callback] Validation FAILED');
    return c.html(`<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Castar — Auth Error</title>
<style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#101010;font-family:sans-serif;color:#fff;text-align:center}.container{padding:24px}h1{color:#F55858}a{color:#4B8DF5}</style>
</head><body><div class="container">
<h1>Auth Failed</h1>
<p>Telegram auth validation failed.</p>
<p><a href="${new URL(c.req.url).origin}/auth/telegram?bot=castar_bot">Try again</a></p>
</div></body></html>`, 403);
  }

  console.log('[Telegram Callback] Validation OK, user id:', params['id']);

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

  // 6. Build deep link
  const userJson = encodeURIComponent(JSON.stringify(telegramUser));
  const deepLink = `castar://auth/callback?token=${token}&user=${userJson}`;

  console.log('[Telegram Callback] Redirecting to deep link');

  // 7. Return HTML page that attempts deep link with fallback
  //    (some browsers block custom scheme redirects via 302)
  return c.html(`<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Castar — Redirecting...</title>
<style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#101010;font-family:sans-serif;color:#fff;text-align:center}.container{padding:24px}h1{font-size:24px;margin-bottom:16px}.btn{display:inline-block;padding:16px 32px;background:#4B8DF5;color:#fff;border-radius:12px;text-decoration:none;font-size:18px;font-weight:600;margin-top:16px}p{color:rgba(255,255,255,0.6);margin-top:12px}</style>
</head><body><div class="container">
<h1>✅ Authorized!</h1>
<p>Redirecting to Castar...</p>
<a class="btn" href="${deepLink}">Open Castar</a>
<p style="margin-top:24px;font-size:12px">If the app doesn't open automatically, tap the button above.</p>
</div>
<script>window.location.href="${deepLink}";</script>
</body></html>`);
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
