/**
 * Castar — Email Auth Service
 *
 * Handles sending verification codes and verifying them via the
 * Cloudflare Worker backend.
 */

import { EMAIL_AUTH_CONFIG } from '../../../shared/constants/config';

export interface SendCodeResponse {
  ok: boolean;
  expiresIn?: number;
  error?: string;
  retryAfter?: number;
}

export interface VerifyCodeResponse {
  ok: boolean;
  token?: string;
  email?: string;
  error?: string;
  attemptsLeft?: number;
}

/**
 * Send a 4-digit verification code to the given email address.
 * Returns `{ ok: true }` on success, or `{ ok: false, error, retryAfter }` on failure.
 */
export async function sendVerificationCode(email: string): Promise<SendCodeResponse> {
  try {
    const res = await fetch(EMAIL_AUTH_CONFIG.sendCodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json() as Record<string, unknown>;

    if (res.ok) {
      return { ok: true, expiresIn: data.expiresIn as number };
    }

    return {
      ok: false,
      error: (data.error as string) || `Server error (${res.status})`,
      retryAfter: data.retryAfter as number | undefined,
    };
  } catch (err) {
    return { ok: false, error: 'Network error. Check your connection.' };
  }
}

/**
 * Verify a 4-digit code for the given email.
 * Returns `{ ok: true, token }` on success, or `{ ok: false, error, attemptsLeft }` on failure.
 */
export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyCodeResponse> {
  try {
    const res = await fetch(EMAIL_AUTH_CONFIG.verifyCodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });

    const data = await res.json() as Record<string, unknown>;

    if (res.ok) {
      return {
        ok: true,
        token: data.token as string,
        email: data.email as string,
      };
    }

    return {
      ok: false,
      error: (data.error as string) || `Verification failed (${res.status})`,
      attemptsLeft: data.attemptsLeft as number | undefined,
    };
  } catch (err) {
    return { ok: false, error: 'Network error. Check your connection.' };
  }
}
