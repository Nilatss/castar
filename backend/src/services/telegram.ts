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

/** Generate the Telegram Login Widget HTML page (matches Figma design) */
export function getTelegramWidgetHtml(botUsername: string, callbackUrl: string, botId: string = ''): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101010">
  <title>Castar — Login with Telegram</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      background: #101010;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }
    /* Background glow */
    .glow {
      position: absolute;
      top: -40%;
      left: -20%;
      width: 140%;
      height: 100%;
      background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%);
      pointer-events: none;
    }
    .glow2 {
      position: absolute;
      top: -30%;
      right: -10%;
      width: 60%;
      height: 60%;
      background: radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 55%);
      pointer-events: none;
    }
    /* Logo at top */
    .logo {
      margin-top: 78px;
      z-index: 10;
    }
    /* Centered content block */
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      justify-content: center;
      z-index: 1;
      padding: 0 24px;
    }
    .title {
      font-size: 32px;
      font-weight: 500;
      color: #FFFFFF;
      text-align: center;
      line-height: 40px;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255,255,255,0.4);
      text-align: center;
      line-height: 22px;
      margin-top: 8px;
      max-width: 277px;
    }
    .widget-wrap {
      margin-top: 32px;
    }
    .widget-wrap {
      margin-top: 0;
      background: rgba(255,255,255,0.1);
      cursor: pointer;
      text-align: center;
      transition: opacity 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="glow2"></div>

  <!-- Logo -->
  <div class="logo">
    <svg width="49" height="46" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.98343 12.3283C9.38617 7.58872 17.3686 8.05095 23.4014 11.1007L26.0342 12.5929L23.0137 12.9122C17.9759 13.7619 12.904 16.6709 9.34573 20.4992C7.73404 22.2779 6.427 24.318 5.7637 26.5929C3.91853 32.235 6.23411 39.3068 11.711 42.4367C11.9636 42.5582 12.215 42.6705 12.4737 42.7736C12.7146 42.869 12.9604 42.956 13.209 43.0343V43.0792C12.953 43.0077 12.6994 42.9276 12.4492 42.84C12.185 42.7467 11.9254 42.6464 11.6651 42.5363C6.63598 40.019 3.29201 34.1617 3.75101 28.2579C2.85842 27.3331 2.06319 26.2967 1.42093 25.1554C-0.0703107 22.6104 -0.591641 19.1283 0.858429 16.2677C1.6097 14.7162 2.72509 13.4227 3.98343 12.3283ZM19.8086 11.6564C14.8857 9.95133 9.03349 10.1057 5.03421 13.5636C3.88096 14.5325 2.89663 15.6528 2.24417 16.9493C1.01094 19.2996 1.10202 22.1936 2.24026 24.7423C2.65692 25.6991 3.19715 26.6165 3.83304 27.463C3.89172 27.0328 3.97033 26.6028 4.07132 26.1749C4.63209 23.5131 6.03578 21.0835 7.82327 19.1154C11.1341 15.6147 15.1903 12.9953 19.8086 11.6564Z" fill="white"/>
      <path d="M15.3069 21.3875C14.8183 26.4871 16.26 32.1312 18.9642 36.6004C20.2524 38.6682 21.879 40.5149 23.9232 41.7762C28.8235 45.0399 36.2344 44.5748 40.6058 40.0613C40.7923 39.8405 40.9701 39.6156 41.139 39.3846C41.7102 38.5996 42.1929 37.7341 42.4671 36.7996H42.4691C42.201 37.7366 41.7404 38.6138 41.1976 39.4266C41.0372 39.6655 40.8687 39.8995 40.6917 40.1307C37.0274 44.3594 30.526 46.1244 24.9944 44.1512C23.8696 44.7876 22.659 45.2991 21.3851 45.6297C18.5348 46.4303 15.0116 45.9797 12.679 43.7898C11.4276 42.6628 10.5076 41.2695 9.80499 39.7977C6.68362 33.3116 9.15251 25.6928 13.6526 20.5584L15.7835 18.3514L15.3069 21.3875ZM13.2562 24.2186C10.3536 28.5938 9.01148 34.3172 11.2757 39.1111C11.8883 40.4532 12.6812 41.6805 13.721 42.6463C15.629 44.4858 18.4405 45.1847 21.1995 44.7312C22.2397 44.5716 23.2745 44.2765 24.263 43.867C23.8591 43.6955 23.4604 43.5047 23.0706 43.2908C20.6151 42.0257 18.6354 39.9791 17.2142 37.6922C14.7704 33.5765 13.3442 29.0021 13.2562 24.2186Z" fill="white"/>
      <path d="M45.0168 33.7147C39.6141 38.4543 31.6317 37.992 25.5989 34.9423L22.9661 33.4501L25.9866 33.1307C31.0244 32.281 36.0962 29.3721 39.6545 25.5438C41.2663 23.7651 42.5732 21.7249 43.2366 19.4501C45.0817 13.8079 42.7662 6.73613 37.2893 3.60632C37.0367 3.48482 36.7852 3.37252 36.5266 3.26941C36.2859 3.17403 36.0405 3.08694 35.7922 3.00867V2.96375C36.0479 3.03517 36.3011 3.11553 36.551 3.203C36.8153 3.29623 37.0748 3.39659 37.3352 3.50671C42.3644 6.02393 45.7083 11.8813 45.2493 17.785C46.1419 18.7099 46.9371 19.7463 47.5793 20.8876C49.0706 23.4326 49.5919 26.9147 48.1418 29.7753C47.3905 31.3268 46.2752 32.6203 45.0168 33.7147ZM29.1926 34.3866C34.1154 36.0915 39.9669 35.9371 43.9661 32.4794C45.1193 31.5105 46.1036 30.3902 46.7561 29.0936C47.9894 26.7434 47.8983 23.8494 46.76 21.3007C46.3433 20.3438 45.8031 19.4265 45.1672 18.58C45.1085 19.0102 45.0299 19.4402 44.929 19.868C44.3682 22.5299 42.9645 24.9594 41.177 26.9276C37.8662 30.4281 33.8107 33.0477 29.1926 34.3866Z" fill="white"/>
      <path d="M27.4159 0.369598C30.2663 -0.43102 33.7894 0.0194238 36.122 2.20944C37.3734 3.33655 38.2934 4.72975 38.996 6.20163C42.1172 12.6877 39.6484 20.3066 35.1483 25.4409L33.0175 27.6479L33.494 24.6118C33.9827 19.5123 32.5409 13.8681 29.8368 9.3989C28.5485 7.331 26.922 5.48442 24.8778 4.22311C19.9775 0.959157 12.5666 1.42437 8.19521 5.93796C8.00866 6.15875 7.83088 6.38368 7.662 6.61472C7.07998 7.4146 6.58849 8.29751 6.31728 9.25241C6.58293 8.29549 7.05041 7.40073 7.60341 6.57272C7.76374 6.33381 7.93227 6.09982 8.10927 5.86862C11.7737 1.63979 18.2748 -0.125343 23.8065 1.84811C24.9314 1.21162 26.1419 0.700218 27.4159 0.369598ZM35.08 3.353C33.172 1.51334 30.3606 0.814541 27.6015 1.26804C26.5611 1.42768 25.5265 1.72271 24.538 2.13229C24.942 2.3038 25.3405 2.49451 25.7304 2.70847C28.1859 3.97362 30.1656 6.02014 31.5868 8.3071C34.0305 12.4228 35.4568 16.9972 35.5448 21.7807C38.4474 17.4055 39.7894 11.682 37.5253 6.88815C36.9126 5.546 36.1198 4.31887 35.08 3.353Z" fill="white"/>
    </svg>
  </div>

  <!-- Centered content -->
  <div class="container">
    <div class="title">Castar</div>
    <div class="subtitle">Register via Telegram to start using the app.</div>
    <div class="widget-wrap">
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="large"
        data-radius="43"
        data-auth-url="${callbackUrl}"
        data-request-access="write">
      </script>
    </div>
  </div>
</body>
</html>`;
}
