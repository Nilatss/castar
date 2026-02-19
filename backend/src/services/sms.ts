/**
 * CaStar — SMS Service (Eskiz.uz)
 * Sends 4-digit verification codes via SMS.
 *
 * TODO: Replace stub with real Eskiz.uz API call
 */

export interface SendSmsResult {
  ok: boolean;
  error?: string;
}

/** Send a verification code SMS via Eskiz.uz */
export async function sendSmsCode(
  _phone: string,
  _code: string,
  _token: string,
): Promise<SendSmsResult> {
  // TODO: Implement Eskiz.uz API call
  // POST https://notify.eskiz.uz/api/message/sms/send
  // {
  //   mobile_phone: phone,
  //   message: `CaStar: Код подтверждения: ${code}`,
  //   from: '4546'
  // }
  // Headers: Authorization: Bearer ${token}
  console.log('[SMS] Stub: would send code to', _phone);
  return { ok: true };
}
