/**
 * CaStar — Telegram Auth Service
 * Validates Telegram Login Widget data using HMAC-SHA256.
 *
 * TODO: Implement full Telegram OAuth flow with HTML widget page
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/** Validate Telegram auth data hash. Returns true if valid. */
export async function validateTelegramAuth(
  _data: Record<string, string>,
  _botToken: string,
): Promise<boolean> {
  // TODO: Implement HMAC-SHA256 validation
  // 1. Create data-check-string by sorting keys (except hash) alphabetically
  // 2. secret_key = SHA256(bot_token)
  // 3. hash = HMAC-SHA256(data_check_string, secret_key)
  // 4. Compare hash with data.hash
  // 5. Check auth_date is not too old (< 1 hour)
  console.log('[Telegram] Stub: would validate auth data');
  return false;
}

/** Generate the Telegram Login Widget HTML page */
export function getTelegramWidgetHtml(botUsername: string, callbackUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CaStar — Login with Telegram</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #101010; font-family: sans-serif; }
    .container { text-align: center; color: #fff; }
    h1 { font-size: 24px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CaStar</h1>
    <script async src="https://telegram.org/js/telegram-widget.js?22"
      data-telegram-login="${botUsername}"
      data-size="large"
      data-radius="12"
      data-auth-url="${callbackUrl}"
      data-request-access="write">
    </script>
  </div>
</body>
</html>`;
}
