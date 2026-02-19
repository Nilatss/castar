/**
 * CaStar — Email Service (Resend.com)
 * Sends 4-digit verification codes via email.
 *
 * TODO: Replace stub with real Resend.com API call
 */

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/** Send a verification code email via Resend.com */
export async function sendEmailCode(
  _email: string,
  _code: string,
  _apiKey: string,
): Promise<SendEmailResult> {
  // TODO: Implement Resend.com API call
  // POST https://api.resend.com/emails
  // {
  //   from: 'CaStar <noreply@castar.app>',
  //   to: email,
  //   subject: 'CaStar — Verification Code',
  //   html: `<p>Your code: <strong>${code}</strong></p>`
  // }
  console.log('[Email] Stub: would send code to', _email);
  return { ok: true };
}
