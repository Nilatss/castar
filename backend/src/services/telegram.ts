/**
 * Castar — Telegram Auth Service
 * Validates Telegram Login Widget data using HMAC-SHA256.
 *
 * Algorithm (from Telegram docs):
 * 1. Sort all fields except 'hash' alphabetically
 * 2. Build data-check-string: "key=value\nkey=value\n..."
 * 3. secret_key = SHA-256(bot_token)
 * 4. hmac = HMAC-SHA-256(data_check_string, secret_key)
 * 5. Compare hmac hex with received hash
 * 6. Check auth_date is not too old (< 1 hour)
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

/** Max allowed age of auth_date (1 hour) */
const MAX_AUTH_AGE_SECONDS = 3600;

/**
 * Validate Telegram Login Widget data using HMAC-SHA256.
 *
 * Uses Web Crypto API (available in Cloudflare Workers).
 *
 * @param data — key-value pairs from Telegram callback (including 'hash')
 * @param botToken — the Telegram bot token (from BotFather)
 * @returns true if the data is authentic and not expired
 */
export async function validateTelegramAuth(
  data: Record<string, string>,
  botToken: string,
): Promise<boolean> {
  const { hash, ...rest } = data;

  if (!hash) {
    console.log('[Telegram] No hash in callback data');
    return false;
  }

  // 1. Build data-check-string: sort keys alphabetically, join with \n
  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n');

  // 2. secret_key = SHA-256(bot_token)
  const encoder = new TextEncoder();
  const botTokenBytes = encoder.encode(botToken);
  const secretKey = await crypto.subtle.digest('SHA-256', botTokenBytes);

  // 3. HMAC-SHA-256(data_check_string, secret_key)
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    encoder.encode(dataCheckString),
  );

  // 4. Convert to hex and compare
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedHash !== hash) {
    console.log('[Telegram] Hash mismatch — data may be forged');
    return false;
  }

  // 5. Check auth_date is not too old
  const authDate = parseInt(rest['auth_date'] || '0', 10);
  const now = Math.floor(Date.now() / 1000);

  if (now - authDate > MAX_AUTH_AGE_SECONDS) {
    console.log('[Telegram] Auth data expired (older than 1 hour)');
    return false;
  }

  return true;
}

/** Generate the Telegram Login Widget HTML page */
export function getTelegramWidgetHtml(botUsername: string, callbackUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Castar — Login with Telegram</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #101010; font-family: sans-serif; }
    .container { text-align: center; color: #fff; }
    h1 { font-size: 24px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Castar</h1>
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
