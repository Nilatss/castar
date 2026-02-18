/**
 * Castar — Phone Auth Service
 *
 * Handles sending SMS verification codes and verifying them via the
 * Cloudflare Worker backend.
 */

import { PHONE_AUTH_CONFIG } from '../../../shared/constants/config';

export interface SendSmsCodeResponse {
  ok: boolean;
  expiresIn?: number;
  error?: string;
  retryAfter?: number;
}

export interface VerifySmsCodeResponse {
  ok: boolean;
  token?: string;
  phone?: string;
  error?: string;
  attemptsLeft?: number;
}

/**
 * Send a 4-digit verification code to the given phone number.
 * Returns `{ ok: true }` on success, or `{ ok: false, error, retryAfter }` on failure.
 */
export async function sendPhoneVerificationCode(phone: string): Promise<SendSmsCodeResponse> {
  try {
    const res = await fetch(PHONE_AUTH_CONFIG.sendCodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
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
 * Verify a 4-digit code for the given phone number.
 * Returns `{ ok: true, token }` on success, or `{ ok: false, error, attemptsLeft }` on failure.
 */
export async function verifyPhoneCode(
  phone: string,
  code: string,
): Promise<VerifySmsCodeResponse> {
  try {
    const res = await fetch(PHONE_AUTH_CONFIG.verifyCodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.trim(),
        code: code.trim(),
      }),
    });

    const data = await res.json() as Record<string, unknown>;

    if (res.ok) {
      return {
        ok: true,
        token: data.token as string,
        phone: data.phone as string,
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
