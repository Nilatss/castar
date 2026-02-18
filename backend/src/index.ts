/**
 * Castar Auth — Cloudflare Worker
 *
 * Telegram Flow (data-auth-url + deep link redirect):
 *   1. GET /auth/telegram           → HTML with Telegram Login Widget (data-auth-url)
 *   2. User taps widget             → Telegram opens OAuth in browser
 *   3. User confirms                → Telegram redirects browser to data-auth-url with auth params
 *   4. GET /auth/telegram/callback  → Worker validates HMAC, creates JWT
 *   5. Worker responds with HTML that redirects to castar://auth/callback?token=...&user=...
 *   6. OS catches deep link         → opens Castar app
 *   7. App's Linking handler parses token + user → loginWithTelegram()
 *
 * Email Flow:
 *   1. POST /auth/email/send-code   → { email } → generates 4-digit code, sends via Resend
 *   2. POST /auth/email/verify-code → { email, code } → validates code, returns JWT
 *
 * Phone Flow:
 *   1. POST /auth/phone/send-code   → { phone } → generates 4-digit code, sends via SMS (Eskiz or console)
 *   2. POST /auth/phone/verify-code → { phone, code } → validates code, returns JWT
 *
 * Secrets (wrangler secret put):
 *   BOT_TOKEN      — Telegram bot token
 *   JWT_SECRET     — HS256 signing key
 *   RESEND_API_KEY — Resend.com API key for email delivery
 *   ESKIZ_TOKEN    — (optional) Eskiz.uz SMS API token; if absent, codes are logged to console
 */

interface Env {
  BOT_TOKEN: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  /** Resend API key for sending email verification codes */
  RESEND_API_KEY: string;
  /** Eskiz.uz SMS API token (optional — if absent, codes are logged to console) */
  ESKIZ_TOKEN?: string;
}

// ===================== Email Code Store =====================
// In-memory store for verification codes (per-isolate, resets on deploy)
// Key: email (lowercase), Value: { code, expiresAt, attempts }
// For production, use KV or D1 for persistence across isolates.

interface CodeEntry {
  code: string;
  expiresAt: number;   // Unix ms
  attempts: number;    // failed verify attempts
}

const emailCodes = new Map<string, CodeEntry>();

const CODE_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const MAX_ATTEMPTS = 5;                // max verify attempts before code invalidation
const RATE_LIMIT_MS = 30 * 1000;      // min 30s between send-code requests per email

// Track last send time per email for rate limiting
const lastSendTime = new Map<string, number>();

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 10000).padStart(4, '0');
}

function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [key, entry] of emailCodes) {
    if (now > entry.expiresAt) emailCodes.delete(key);
  }
  for (const [key, time] of lastSendTime) {
    if (now - time > CODE_TTL_MS) lastSendTime.delete(key);
  }
}

// ===================== Phone Code Store =====================
// Self-generated 4-digit codes (same approach as email).
// SMS delivery via Eskiz.uz API (or console.log for testing).
//
// Flow:
//   1. POST /auth/phone/send-code → generates 4-digit code, sends SMS → stores code
//   2. POST /auth/phone/verify-code → validates code → returns JWT

const phoneCodes = new Map<string, CodeEntry>(); // key: phone (E.164)
const phoneLastSendTime = new Map<string, number>();

function cleanupExpiredPhoneCodes() {
  const now = Date.now();
  for (const [key, entry] of phoneCodes) {
    if (now > entry.expiresAt) phoneCodes.delete(key);
  }
  for (const [key, time] of phoneLastSendTime) {
    if (now - time > CODE_TTL_MS) phoneLastSendTime.delete(key);
  }
}

// Send SMS via Eskiz.uz API (or log to console if no token)
async function sendSms(
  phone: string,
  message: string,
  eskizToken?: string,
): Promise<{ ok: boolean; error?: string }> {
  // If no Eskiz token, log code to console (dev/test mode)
  if (!eskizToken) {
    console.log(`[SMS-DEV] To: ${phone} | Message: ${message}`);
    return { ok: true };
  }

  try {
    const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${eskizToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile_phone: phone.replace('+', ''),
        message,
        from: '4546',
      }),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const text = await res.text();
      console.error('[sendSms] Eskiz error:', res.status, text);
      return { ok: false, error: `SMS delivery failed: ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[sendSms] Error:', err);
    return { ok: false, error: `SMS send failed: ${err}` };
  }
}

// ===================== i18n =====================

interface PageStrings {
  // Login page
  loginTitle: string;
  loginSubtitle: string;
  footerText: string;
  // Redirect page
  welcomeBack: string; // with {name} placeholder
  welcomeDefault: string;
  redirecting: string;
  openApp: string;
  hintNotOpened: string;
  tapToOpen: string;
  // Error page
  authFailed: string;
  errorHint: string;
  closeTab: string;
}

const translations: Record<string, PageStrings> = {
  en: {
    loginTitle: 'Sign in to Castar',
    loginSubtitle: 'Use your Telegram account to continue',
    footerText: 'Castar · Your finances, simplified',
    welcomeBack: 'Welcome back, {name}!',
    welcomeDefault: 'Success!',
    redirecting: 'Redirecting to Castar...',
    openApp: 'Open Castar',
    hintNotOpened: "If the app didn't open, make sure Castar is installed",
    tapToOpen: 'Tap the button to open the app',
    authFailed: 'Authentication failed',
    errorHint: 'Please close this tab and try again in the app.',
    closeTab: 'Close this tab',
  },
  ru: {
    loginTitle: 'Войти в Castar',
    loginSubtitle: 'Используйте аккаунт Telegram для продолжения',
    footerText: 'Castar · Ваши финансы, просто',
    welcomeBack: 'С возвращением, {name}!',
    welcomeDefault: 'Успешно!',
    redirecting: 'Перенаправление в Castar...',
    openApp: 'Открыть Castar',
    hintNotOpened: 'Если приложение не открылось, убедитесь что Castar установлен',
    tapToOpen: 'Нажмите кнопку, чтобы открыть приложение',
    authFailed: 'Ошибка авторизации',
    errorHint: 'Закройте эту вкладку и попробуйте снова в приложении.',
    closeTab: 'Закрыть вкладку',
  },
  uz: {
    loginTitle: 'Castarga kirish',
    loginSubtitle: "Davom etish uchun Telegram hisobingizdan foydalaning",
    footerText: 'Castar · Moliyangiz, sodda',
    welcomeBack: 'Xush kelibsiz, {name}!',
    welcomeDefault: 'Muvaffaqiyatli!',
    redirecting: 'Castarga yo\'naltirilmoqda...',
    openApp: 'Castarni ochish',
    hintNotOpened: "Ilova ochilmagan bo'lsa, Castar o'rnatilganligini tekshiring",
    tapToOpen: 'Ilovani ochish uchun tugmani bosing',
    authFailed: 'Autentifikatsiya xatosi',
    errorHint: "Bu varaqni yoping va ilovada qaytadan urinib ko'ring.",
    closeTab: 'Varaqni yopish',
  },
  be: {
    loginTitle: 'Увайсці ў Castar',
    loginSubtitle: 'Выкарыстоўвайце акаўнт Telegram для працягу',
    footerText: 'Castar · Вашы фінансы, проста',
    welcomeBack: 'З вяртаннем, {name}!',
    welcomeDefault: 'Паспяхова!',
    redirecting: 'Перанакіраванне ў Castar...',
    openApp: 'Адкрыць Castar',
    hintNotOpened: 'Калі праграма не адкрылася, пераканайцеся што Castar усталяваны',
    tapToOpen: 'Націсніце кнопку, каб адкрыць праграму',
    authFailed: 'Памылка аўтарызацыі',
    errorHint: 'Зачыніце гэтую ўкладку і паспрабуйце зноў у праграме.',
    closeTab: 'Зачыніць укладку',
  },
  uk: {
    loginTitle: 'Увійти в Castar',
    loginSubtitle: 'Використовуйте акаунт Telegram для продовження',
    footerText: 'Castar · Ваші фінанси, просто',
    welcomeBack: 'З поверненням, {name}!',
    welcomeDefault: 'Успішно!',
    redirecting: 'Перенаправлення в Castar...',
    openApp: 'Відкрити Castar',
    hintNotOpened: 'Якщо додаток не відкрився, переконайтеся що Castar встановлений',
    tapToOpen: 'Натисніть кнопку, щоб відкрити додаток',
    authFailed: 'Помилка автентифікації',
    errorHint: 'Закрийте цю вкладку і спробуйте знову в додатку.',
    closeTab: 'Закрити вкладку',
  },
  kk: {
    loginTitle: 'Castar-ға кіру',
    loginSubtitle: 'Жалғастыру үшін Telegram аккаунтыңызды пайдаланыңыз',
    footerText: 'Castar · Қаржыңыз, қарапайым',
    welcomeBack: 'Қайта оралуыңызбен, {name}!',
    welcomeDefault: 'Сәтті!',
    redirecting: 'Castar-ға бағытталуда...',
    openApp: 'Castar-ды ашу',
    hintNotOpened: 'Қолданба ашылмаса, Castar орнатылғанын тексеріңіз',
    tapToOpen: 'Қолданбаны ашу үшін батырманы басыңыз',
    authFailed: 'Аутентификация қатесі',
    errorHint: 'Бұл қойындыны жабыңыз және қолданбада қайталап көріңіз.',
    closeTab: 'Қойындыны жабу',
  },
  de: {
    loginTitle: 'Bei Castar anmelden',
    loginSubtitle: 'Verwenden Sie Ihr Telegram-Konto, um fortzufahren',
    footerText: 'Castar · Ihre Finanzen, vereinfacht',
    welcomeBack: 'Willkommen zurück, {name}!',
    welcomeDefault: 'Erfolg!',
    redirecting: 'Weiterleitung zu Castar...',
    openApp: 'Castar öffnen',
    hintNotOpened: 'Wenn die App nicht geöffnet wurde, stellen Sie sicher, dass Castar installiert ist',
    tapToOpen: 'Tippen Sie auf die Schaltfläche, um die App zu öffnen',
    authFailed: 'Authentifizierung fehlgeschlagen',
    errorHint: 'Bitte schließen Sie diesen Tab und versuchen Sie es erneut in der App.',
    closeTab: 'Tab schließen',
  },
  az: {
    loginTitle: 'Castar-a daxil ol',
    loginSubtitle: 'Davam etmək üçün Telegram hesabınızdan istifadə edin',
    footerText: 'Castar · Maliyyəniz, sadə',
    welcomeBack: 'Xoş gəldiniz, {name}!',
    welcomeDefault: 'Uğurlu!',
    redirecting: 'Castar-a yönləndirilir...',
    openApp: 'Castar-ı aç',
    hintNotOpened: 'Tətbiq açılmadısa, Castar-ın quraşdırıldığına əmin olun',
    tapToOpen: 'Tətbiqi açmaq üçün düyməni basın',
    authFailed: 'Autentifikasiya xətası',
    errorHint: 'Bu tabı bağlayın və tətbiqdə yenidən cəhd edin.',
    closeTab: 'Tabı bağla',
  },
};

function getStrings(lang: string): PageStrings {
  return translations[lang] || translations['en'];
}

// ===================== Design System =====================

const LOGO_SVG = `<svg width="49" height="46" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.98343 12.3283C9.38617 7.58872 17.3686 8.05095 23.4014 11.1007L26.0342 12.5929L23.0137 12.9122C17.9759 13.7619 12.904 16.6709 9.34573 20.4992C7.73404 22.2779 6.427 24.318 5.7637 26.5929C3.91853 32.235 6.23411 39.3068 11.711 42.4367C11.9636 42.5582 12.215 42.6705 12.4737 42.7736C12.7146 42.869 12.9604 42.956 13.209 43.0343V43.0792C12.953 43.0077 12.6994 42.9276 12.4492 42.84C12.185 42.7467 11.9254 42.6464 11.6651 42.5363C6.63598 40.019 3.29201 34.1617 3.75101 28.2579C2.85842 27.3331 2.06319 26.2967 1.42093 25.1554C-0.0703107 22.6104 -0.591641 19.1283 0.858429 16.2677C1.6097 14.7162 2.72509 13.4227 3.98343 12.3283ZM19.8086 11.6564C14.8857 9.95133 9.03349 10.1057 5.03421 13.5636C3.88096 14.5325 2.89663 15.6528 2.24417 16.9493C1.01094 19.2996 1.10202 22.1936 2.24026 24.7423C2.65692 25.6991 3.19715 26.6165 3.83304 27.463C3.89172 27.0328 3.97033 26.6028 4.07132 26.1749C4.63209 23.5131 6.03578 21.0835 7.82327 19.1154C11.1341 15.6147 15.1903 12.9953 19.8086 11.6564Z" fill="white"/>
<path d="M15.3069 21.3875C14.8183 26.4871 16.26 32.1312 18.9642 36.6004C20.2524 38.6682 21.879 40.5149 23.9232 41.7762C28.8235 45.0399 36.2344 44.5748 40.6058 40.0613C40.7923 39.8405 40.9701 39.6156 41.139 39.3846C41.7102 38.5996 42.1929 37.7341 42.4671 36.7996H42.4691C42.201 37.7366 41.7404 38.6138 41.1976 39.4266C41.0372 39.6655 40.8687 39.8995 40.6917 40.1307C37.0274 44.3594 30.526 46.1244 24.9944 44.1512C23.8696 44.7876 22.659 45.2991 21.3851 45.6297C18.5348 46.4303 15.0116 45.9797 12.679 43.7898C11.4276 42.6628 10.5076 41.2695 9.80499 39.7977C6.68362 33.3116 9.15251 25.6928 13.6526 20.5584L15.7835 18.3514L15.3069 21.3875ZM13.2562 24.2186C10.3536 28.5938 9.01148 34.3172 11.2757 39.1111C11.8883 40.4532 12.6812 41.6805 13.721 42.6463C15.629 44.4858 18.4405 45.1847 21.1995 44.7312C22.2397 44.5716 23.2745 44.2765 24.263 43.867C23.8591 43.6955 23.4604 43.5047 23.0706 43.2908C20.6151 42.0257 18.6354 39.9791 17.2142 37.6922C14.7704 33.5765 13.3442 29.0021 13.2562 24.2186Z" fill="white"/>
<path d="M45.0168 33.7147C39.6141 38.4543 31.6317 37.992 25.5989 34.9423L22.9661 33.4501L25.9866 33.1307C31.0244 32.281 36.0962 29.3721 39.6545 25.5438C41.2663 23.7651 42.5732 21.7249 43.2366 19.4501C45.0817 13.8079 42.7662 6.73613 37.2893 3.60632C37.0367 3.48482 36.7852 3.37252 36.5266 3.26941C36.2859 3.17403 36.0405 3.08694 35.7922 3.00867V2.96375C36.0479 3.03517 36.3011 3.11553 36.551 3.203C36.8153 3.29623 37.0748 3.39659 37.3352 3.50671C42.3644 6.02393 45.7083 11.8813 45.2493 17.785C46.1419 18.7099 46.9371 19.7463 47.5793 20.8876C49.0706 23.4326 49.5919 26.9147 48.1418 29.7753C47.3905 31.3268 46.2752 32.6203 45.0168 33.7147ZM29.1926 34.3866C34.1154 36.0915 39.9669 35.9371 43.9661 32.4794C45.1193 31.5105 46.1036 30.3902 46.7561 29.0936C47.9894 26.7434 47.8983 23.8494 46.76 21.3007C46.3433 20.3438 45.8031 19.4265 45.1672 18.58C45.1085 19.0102 45.0299 19.4402 44.929 19.868C44.3682 22.5299 42.9645 24.9594 41.177 26.9276C37.8662 30.4281 33.8107 33.0477 29.1926 34.3866Z" fill="white"/>
<path d="M27.4159 0.369598C30.2663 -0.43102 33.7894 0.0194238 36.122 2.20944C37.3734 3.33655 38.2934 4.72975 38.996 6.20163C42.1172 12.6877 39.6484 20.3066 35.1483 25.4409L33.0175 27.6479L33.494 24.6118C33.9827 19.5123 32.5409 13.8681 29.8368 9.3989C28.5485 7.331 26.922 5.48442 24.8778 4.22311C19.9775 0.959157 12.5666 1.42437 8.19521 5.93796C8.00866 6.15875 7.83088 6.38368 7.662 6.61472C7.07998 7.4146 6.58849 8.29751 6.31728 9.25241C6.58293 8.29549 7.05041 7.40073 7.60341 6.57272C7.76374 6.33381 7.93227 6.09982 8.10927 5.86862C11.7737 1.63979 18.2748 -0.125343 23.8065 1.84811C24.9314 1.21162 26.1419 0.700218 27.4159 0.369598ZM35.08 3.353C33.172 1.51334 30.3606 0.814541 27.6015 1.26804C26.5611 1.42768 25.5265 1.72271 24.538 2.13229C24.942 2.3038 25.3405 2.49451 25.7304 2.70847C28.1859 3.97362 30.1656 6.02014 31.5868 8.3071C34.0305 12.4228 35.4568 16.9972 35.5448 21.7807C38.4474 17.4055 39.7894 11.682 37.5253 6.88815C36.9126 5.546 36.1198 4.31887 35.08 3.353Z" fill="white"/>
</svg>`;

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #101010; color: #FFFFFF;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100dvh; padding: 24px; text-align: center;
    position: relative; overflow: hidden;
  }
  body::before {
    content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%);
    pointer-events: none;
  }
  .content {
    position: relative; z-index: 1; display: flex; flex-direction: column;
    align-items: center; max-width: 360px; width: 100%;
  }
  .logo { margin-bottom: 32px; opacity: 0.9; }
  .title { font-size: 24px; font-weight: 500; line-height: 32px; margin-bottom: 8px; letter-spacing: -0.01em; }
  .subtitle { font-size: 14px; font-weight: 400; line-height: 20px; color: rgba(255,255,255,0.4); margin-bottom: 40px; }
  .tg-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
  .tg-wrap iframe { border-radius: 12px !important; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 24px;
    padding-bottom: max(16px, env(safe-area-inset-bottom)); text-align: center; }
  .footer-text { font-size: 12px; color: rgba(255,255,255,0.2); line-height: 17px; }
`;

// ===================== Helpers =====================

async function validateTelegramAuth(
  params: Record<string, string>,
  botToken: string,
): Promise<boolean> {
  const hash = params.hash;
  if (!hash) return false;

  const authDate = parseInt(params.auth_date, 10);
  if (isNaN(authDate)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 3600) return false;

  const checkString = Object.keys(params)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.digest('SHA-256', encoder.encode(botToken));

  const key = await crypto.subtle.importKey(
    'raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(checkString));

  const hexSignature = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexSignature === hash;
}

async function createJWT(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + 30 * 24 * 60 * 60 };

  const b64url = (data: string) =>
    btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(fullPayload));
  const unsigned = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${unsigned}.${sigB64}`;
}

// Escape HTML to prevent XSS
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===================== Email Sending (Resend) =====================

async function sendVerificationEmail(
  email: string,
  code: string,
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Castar <onboarding@resend.dev>',
        to: [email],
        subject: `${code} — Castar`,
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 24px; text-align: center;">
            <h1 style="font-size: 20px; font-weight: 500; color: #111; margin-bottom: 8px;">Verification Code</h1>
            <p style="font-size: 14px; color: #666; margin-bottom: 32px;">Enter this code in the Castar app</p>
            <div style="font-size: 36px; font-weight: 600; letter-spacing: 12px; color: #111; padding: 24px; background: #f5f5f5; border-radius: 16px; margin-bottom: 32px;">${code}</div>
            <p style="font-size: 12px; color: #999;">This code expires in 5 minutes.<br/>If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      const errMsg = String(data.message || `Resend API error: ${res.status}`);
      console.error('[sendVerificationEmail] Resend error:', res.status, JSON.stringify(data));
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Failed to send email: ${err}` };
  }
}

// ===================== HTML Pages =====================

function loginPage(botName: string, callbackUrl: string, lang: string): string {
  const s = getStrings(lang);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>Castar</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="content">
    <div class="logo">${LOGO_SVG}</div>
    <div class="title">${esc(s.loginTitle)}</div>
    <div class="subtitle">${esc(s.loginSubtitle)}</div>
    <div class="tg-wrap">
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${esc(botName)}"
        data-size="large" data-radius="43"
        data-auth-url="${esc(callbackUrl)}"
        data-request-access="write"></script>
    </div>
  </div>
  <div class="footer"><div class="footer-text">${esc(s.footerText)}</div></div>
</body>
</html>`;
}

function redirectPage(deepLink: string, userName: string, lang: string): string {
  const s = getStrings(lang);
  const greeting = userName
    ? s.welcomeBack.replace('{name}', esc(userName))
    : s.welcomeDefault;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>Castar</title>
  <style>
    ${BASE_CSS}
    .check-icon { width:64px;height:64px;border-radius:50%;background:rgba(74,222,128,0.12);
      display:flex;align-items:center;justify-content:center;margin-bottom:24px; }
    .check-icon svg { width:32px;height:32px; }
    .greeting { font-size:24px;font-weight:500;line-height:32px;margin-bottom:8px; }
    .redirect-text { font-size:14px;color:rgba(255,255,255,0.4);line-height:20px;margin-bottom:32px; }
    .spinner { width:24px;height:24px;border:2px solid rgba(255,255,255,0.15);
      border-top-color:rgba(255,255,255,0.6);border-radius:50%;
      animation:spin .7s linear infinite;margin-bottom:32px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .open-btn { display:none;padding:14px 32px;background:#FFF;color:#101010;
      font-family:'Inter',sans-serif;font-size:16px;font-weight:500;
      border:none;border-radius:43px;cursor:pointer;text-decoration:none;transition:opacity .2s; }
    .open-btn:active { opacity:0.8; }
    .hint { display:none;font-size:12px;color:rgba(255,255,255,0.3);margin-top:16px;line-height:17px; }
  </style>
</head>
<body>
  <div class="content">
    <div class="logo">${LOGO_SVG}</div>
    <div class="check-icon">
      <svg viewBox="0 0 32 32" fill="none"><path d="M8 16.5L13 21.5L24 10.5" stroke="#4ADE80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="greeting">${greeting}</div>
    <div class="redirect-text" id="st">${esc(s.redirecting)}</div>
    <div class="spinner" id="sp"></div>
    <a href="${deepLink}" class="open-btn" id="ob">${esc(s.openApp)}</a>
    <div class="hint" id="hn">${esc(s.hintNotOpened)}</div>
  </div>
  <script>
    window.location.href='${deepLink}';
    setTimeout(function(){
      document.getElementById('sp').style.display='none';
      document.getElementById('ob').style.display='inline-block';
      document.getElementById('hn').style.display='block';
      document.getElementById('st').textContent='${s.tapToOpen.replace(/'/g, "\\'")}';
    },2500);
  </script>
</body>
</html>`;
}

function errorPage(lang: string): string {
  const s = getStrings(lang);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>Castar</title>
  <style>
    ${BASE_CSS}
    .error-icon { width:64px;height:64px;border-radius:50%;background:rgba(245,88,88,0.12);
      display:flex;align-items:center;justify-content:center;margin-bottom:24px; }
    .error-icon svg { width:32px;height:32px; }
    .error-title { font-size:20px;font-weight:500;line-height:26px;color:#F55858;margin-bottom:8px; }
    .error-hint { font-size:14px;color:rgba(255,255,255,0.4);line-height:20px;margin-bottom:32px; }
    .retry-btn { padding:14px 32px;background:rgba(255,255,255,0.1);color:#FFF;
      font-family:'Inter',sans-serif;font-size:16px;font-weight:500;
      border:1px solid rgba(255,255,255,0.07);border-radius:43px;
      cursor:pointer;text-decoration:none;transition:opacity .2s; }
    .retry-btn:active { opacity:0.7; }
  </style>
</head>
<body>
  <div class="content">
    <div class="logo">${LOGO_SVG}</div>
    <div class="error-icon">
      <svg viewBox="0 0 32 32" fill="none"><path d="M20 12L12 20M12 12L20 20" stroke="#F55858" stroke-width="2.5" stroke-linecap="round"/></svg>
    </div>
    <div class="error-title">${esc(s.authFailed)}</div>
    <div class="error-hint">${esc(s.errorHint)}</div>
    <a href="javascript:window.close()" class="retry-btn" onclick="window.close();return false;">${esc(s.closeTab)}</a>
  </div>
</body>
</html>`;
}

// ===================== Request Handler =====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ---- GET /auth/telegram — Login page with Telegram widget ----
    if (path === '/auth/telegram' && request.method === 'GET') {
      const botName = url.searchParams.get('bot') || 'castar_bot';
      const lang = url.searchParams.get('lang') || 'en';
      // Pass lang through to callback so redirect/error pages are also localized
      const callbackUrl = `${url.origin}/auth/telegram/callback?lang=${lang}`;

      return new Response(loginPage(botName, callbackUrl, lang), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // ---- GET /auth/telegram/callback — Validates auth, redirects to app ----
    if (path === '/auth/telegram/callback' && request.method === 'GET') {
      const lang = url.searchParams.get('lang') || 'en';

      // Collect Telegram params (exclude our 'lang' param)
      const params: Record<string, string> = {};
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'lang') {
          params[key] = value;
        }
      }

      const isValid = await validateTelegramAuth(params, env.BOT_TOKEN);
      if (!isValid) {
        return new Response(errorPage(lang), {
          status: 403,
          headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
        });
      }

      const user = {
        id: params.id,
        first_name: params.first_name || '',
        last_name: params.last_name || '',
        username: params.username || '',
        photo_url: params.photo_url || '',
      };

      const token = await createJWT({ sub: user.id, telegram: user }, env.JWT_SECRET);
      const userEncoded = encodeURIComponent(JSON.stringify(user));
      const deepLink = `castar://auth/callback?token=${token}&user=${userEncoded}`;

      return new Response(redirectPage(deepLink, user.first_name, lang), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // ---- POST /auth/telegram/verify — JSON API (compatibility) ----
    if (path === '/auth/telegram/verify' && request.method === 'POST') {
      let body: Record<string, string>;
      try {
        body = await request.json() as Record<string, string>;
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        params[key] = String(value);
      }

      const isValid = await validateTelegramAuth(params, env.BOT_TOKEN);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid Telegram auth data' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const user = {
        id: params.id, first_name: params.first_name || '',
        last_name: params.last_name || '', username: params.username || '',
        photo_url: params.photo_url || '',
      };

      const token = await createJWT({ sub: user.id, telegram: user }, env.JWT_SECRET);
      return new Response(JSON.stringify({ token, user }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- POST /auth/email/send-code — Generate & send 4-digit code ----
    if (path === '/auth/email/send-code' && request.method === 'POST') {
      cleanupExpiredCodes();

      let body: { email?: string };
      try {
        body = await request.json() as { email?: string };
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const email = (body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email address' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Rate limiting: 30s between requests per email
      const lastSent = lastSendTime.get(email);
      if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
        const waitSeconds = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000);
        return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: waitSeconds }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const code = generateCode();
      emailCodes.set(email, {
        code,
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
      });
      lastSendTime.set(email, Date.now());

      // Send email via Resend
      console.log('[send-code] Sending code to:', email);
      const sendResult = await sendVerificationEmail(email, code, env.RESEND_API_KEY);
      if (!sendResult.ok) {
        console.error('[send-code] Failed:', sendResult.error);
        emailCodes.delete(email);
        return new Response(JSON.stringify({ error: 'Failed to send email', detail: sendResult.error }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      console.log('[send-code] Success for:', email);

      return new Response(JSON.stringify({ ok: true, expiresIn: CODE_TTL_MS / 1000 }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- POST /auth/email/verify-code — Validate code & return JWT ----
    if (path === '/auth/email/verify-code' && request.method === 'POST') {
      cleanupExpiredCodes();

      let body: { email?: string; code?: string };
      try {
        body = await request.json() as { email?: string; code?: string };
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const email = (body.email || '').trim().toLowerCase();
      const code = (body.code || '').trim();

      if (!email || !code) {
        return new Response(JSON.stringify({ error: 'Email and code are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const entry = emailCodes.get(email);
      if (!entry) {
        return new Response(JSON.stringify({ error: 'No code found. Please request a new one.' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        emailCodes.delete(email);
        return new Response(JSON.stringify({ error: 'Code expired. Please request a new one.' }),
          { status: 410, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Check attempts
      if (entry.attempts >= MAX_ATTEMPTS) {
        emailCodes.delete(email);
        return new Response(JSON.stringify({ error: 'Too many attempts. Please request a new code.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Validate code
      if (entry.code !== code) {
        entry.attempts++;
        return new Response(JSON.stringify({ error: 'Invalid code', attemptsLeft: MAX_ATTEMPTS - entry.attempts }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Success — remove code and create JWT
      emailCodes.delete(email);

      const token = await createJWT({ sub: email, email, method: 'email' }, env.JWT_SECRET);
      return new Response(JSON.stringify({ ok: true, token, email }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- POST /auth/phone/send-code — Generate & send 4-digit code via SMS ----
    if (path === '/auth/phone/send-code' && request.method === 'POST') {
      cleanupExpiredPhoneCodes();

      let body: { phone?: string };
      try {
        body = await request.json() as { phone?: string };
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const phone = (body.phone || '').trim();
      // Basic E.164 validation: starts with +, 7-15 digits
      if (!phone || !/^\+[1-9]\d{6,14}$/.test(phone)) {
        return new Response(JSON.stringify({ error: 'Invalid phone number. Use E.164 format (+998901234567)' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Rate limiting: 30s between requests per phone
      const lastSent = phoneLastSendTime.get(phone);
      if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
        const waitSeconds = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000);
        return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: waitSeconds }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const code = generateCode();
      phoneCodes.set(phone, {
        code,
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
      });
      phoneLastSendTime.set(phone, Date.now());

      // Send SMS (Eskiz if token present, otherwise console.log)
      console.log('[phone/send-code] Sending code to:', phone);
      const smsResult = await sendSms(phone, `Castar: ${code}`, env.ESKIZ_TOKEN);
      if (!smsResult.ok) {
        console.error('[phone/send-code] SMS failed:', smsResult.error);
        phoneCodes.delete(phone);
        return new Response(JSON.stringify({ error: 'Failed to send SMS', detail: smsResult.error }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      console.log('[phone/send-code] Success for:', phone);
      return new Response(JSON.stringify({ ok: true, expiresIn: CODE_TTL_MS / 1000 }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- POST /auth/phone/verify-code — Validate code & return JWT ----
    if (path === '/auth/phone/verify-code' && request.method === 'POST') {
      cleanupExpiredPhoneCodes();

      let body: { phone?: string; code?: string };
      try {
        body = await request.json() as { phone?: string; code?: string };
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const phone = (body.phone || '').trim();
      const code = (body.code || '').trim();

      if (!phone || !code) {
        return new Response(JSON.stringify({ error: 'Phone and code are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const entry = phoneCodes.get(phone);
      if (!entry) {
        return new Response(JSON.stringify({ error: 'No code found. Please request a new one.' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        phoneCodes.delete(phone);
        return new Response(JSON.stringify({ error: 'Code expired. Please request a new one.' }),
          { status: 410, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Check attempts
      if (entry.attempts >= MAX_ATTEMPTS) {
        phoneCodes.delete(phone);
        return new Response(JSON.stringify({ error: 'Too many attempts. Please request a new code.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Validate code
      if (entry.code !== code) {
        entry.attempts++;
        return new Response(JSON.stringify({ error: 'Invalid code', attemptsLeft: MAX_ATTEMPTS - entry.attempts }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Success — remove code and create JWT
      phoneCodes.delete(phone);

      const token = await createJWT({ sub: phone, phone, method: 'phone' }, env.JWT_SECRET);
      return new Response(JSON.stringify({ ok: true, token, phone }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- Health check ----
    if (path === '/' || path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'castar-auth' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ---- 404 ----
    return new Response(JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  },
};
