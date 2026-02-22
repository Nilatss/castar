/**
 * Castar — Telegram Auth Service
 *
 * Handles:
 *  - Building the Worker auth URL for WebView
 *  - Parsing the deep link callback (castar://auth/callback?token=...&user=...)
 *  - Persisting / reading / clearing the JWT via expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { TELEGRAM_CONFIG } from '../../../shared/constants/config';

// ===================== Types =====================

export interface TelegramUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo_url: string;
}

export interface AuthCallbackResult {
  token: string;
  user: TelegramUser;
}

// ===================== Constants =====================

const TOKEN_KEY = 'castar_auth_token';
const USER_KEY = 'castar_auth_user';
const DISPLAY_NAME_KEY = 'castar_display_name';
const PIN_KEY = 'castar_pin';
const LOCKOUT_UNTIL_KEY = 'castar_lockout_until';
const FAILED_ATTEMPTS_KEY = 'castar_failed_attempts';

// ===================== Auth URL =====================

/**
 * Returns the full URL to open in the browser for Telegram login.
 * @param lang — current app language code (uz, ru, en, etc.)
 */
export function getTelegramAuthUrl(lang?: string): string {
  const base = `${TELEGRAM_CONFIG.workerUrl}/auth/telegram?bot=${TELEGRAM_CONFIG.botUsername}`;
  return lang ? `${base}&lang=${lang}` : base;
}

// ===================== Callback Parsing =====================

/**
 * Check if a URL is the auth callback deep link.
 */
export function isAuthCallback(url: string): boolean {
  return url.startsWith('castar://auth/callback');
}

/**
 * Parse the auth callback URL and extract token + user.
 * Returns null if parsing fails.
 */
export function parseAuthCallback(url: string): AuthCallbackResult | null {
  try {
    // URL constructor doesn't handle custom schemes well,
    // so we replace the scheme with https:// for parsing.
    const parsed = new URL(url.replace('castar://', 'https://placeholder/'));
    const token = parsed.searchParams.get('token');
    const userJson = parsed.searchParams.get('user');

    if (!token || !userJson) return null;

    const user: TelegramUser = JSON.parse(decodeURIComponent(userJson));

    if (!user.id) return null;

    return { token, user };
  } catch {
    return null;
  }
}

// ===================== Token Persistence =====================

/**
 * Save JWT token to secure storage.
 */
export async function persistToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Read JWT token from secure storage.
 * Returns null if not found.
 */
export async function getPersistedToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Remove JWT token from secure storage.
 */
export async function clearPersistedToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ===================== User Persistence =====================

/**
 * Save Telegram user data to secure storage.
 */
export async function persistUser(user: TelegramUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

/**
 * Read Telegram user data from secure storage.
 * Returns null if not found.
 */
export async function getPersistedUser(): Promise<TelegramUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TelegramUser;
  } catch {
    return null;
  }
}

/**
 * Remove Telegram user data from secure storage.
 */
export async function clearPersistedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ===================== Display Name Persistence =====================

/**
 * Save display name to secure storage.
 * This persists across logout so returning users skip SetName.
 */
export async function persistDisplayName(name: string): Promise<void> {
  await SecureStore.setItemAsync(DISPLAY_NAME_KEY, name);
}

/**
 * Read display name from secure storage.
 * Returns null if not set (first-time user).
 */
export async function getPersistedDisplayName(): Promise<string | null> {
  return SecureStore.getItemAsync(DISPLAY_NAME_KEY);
}

/**
 * Remove display name from secure storage.
 */
export async function clearPersistedDisplayName(): Promise<void> {
  await SecureStore.deleteItemAsync(DISPLAY_NAME_KEY);
}

// ===================== PIN Persistence =====================

/**
 * Save PIN code to secure storage.
 */
export async function persistPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

/**
 * Read PIN code from secure storage.
 * Returns null if not set.
 */
export async function getPersistedPin(): Promise<string | null> {
  return SecureStore.getItemAsync(PIN_KEY);
}

/**
 * Remove PIN code from secure storage.
 */
export async function clearPersistedPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// ===================== PIN Lockout Persistence =====================

/**
 * Save lockout timestamp (epoch ms) to secure storage.
 * When set, PIN entry is blocked until Date.now() > this value.
 */
export async function persistLockoutUntil(timestamp: number): Promise<void> {
  await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(timestamp));
}

/**
 * Read lockout timestamp from secure storage.
 * Returns 0 if not set (no active lockout).
 */
export async function getLockoutUntil(): Promise<number> {
  const raw = await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY);
  return raw ? Number(raw) : 0;
}

/**
 * Save failed PIN attempt count to secure storage.
 */
export async function persistFailedAttempts(count: number): Promise<void> {
  await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(count));
}

/**
 * Read failed PIN attempt count from secure storage.
 * Returns 0 if not set.
 */
export async function getFailedAttempts(): Promise<number> {
  const raw = await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY);
  return raw ? Number(raw) : 0;
}

/**
 * Clear lockout data (both timestamp and attempt count).
 * Called after successful PIN entry or when lockout expires.
 */
export async function clearLockoutData(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY),
    SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY),
  ]);
}

// ===================== Combined Operations =====================

/**
 * Save both token and user data after successful auth.
 */
export async function persistAuth(
  token: string,
  user: TelegramUser,
): Promise<void> {
  await Promise.all([persistToken(token), persistUser(user)]);
}

/**
 * Clear session data (token + user) but keep display name.
 * Display name is preserved so returning users are recognized.
 */
export async function clearAuth(): Promise<void> {
  await Promise.all([clearPersistedToken(), clearPersistedUser()]);
}

/**
 * Clear ALL data including display name (full account reset).
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearPersistedToken(),
    clearPersistedUser(),
    clearPersistedDisplayName(),
    clearPersistedPin(),
    clearLinkedAccounts(),
  ]);
}

/**
 * Save email auth data (token + email as user).
 * Creates a minimal TelegramUser-compatible shape so the rest of the
 * persistence layer works identically for email and Telegram users.
 */
export async function persistEmailAuth(
  token: string,
  email: string,
): Promise<void> {
  const syntheticUser: TelegramUser = {
    id: email,
    first_name: '',
    last_name: '',
    username: '',
    photo_url: '',
  };
  await persistAuth(token, syntheticUser);
}

/**
 * Save phone auth data (token + phone as user).
 * Creates a minimal TelegramUser-compatible shape so the rest of the
 * persistence layer works identically for phone, email, and Telegram users.
 */
export async function persistPhoneAuth(
  token: string,
  phone: string,
): Promise<void> {
  const syntheticUser: TelegramUser = {
    id: phone,
    first_name: '',
    last_name: '',
    username: '',
    photo_url: '',
  };
  await persistAuth(token, syntheticUser);
}

/**
 * Load persisted auth state. Returns null if no valid session exists.
 */
export async function loadPersistedAuth(): Promise<AuthCallbackResult | null> {
  const [token, user] = await Promise.all([
    getPersistedToken(),
    getPersistedUser(),
  ]);

  if (!token || !user) return null;

  return { token, user };
}

// ===================== Linked Accounts Persistence =====================
// These keys store ADDITIONAL auth methods linked from Settings.
// They are separate from the primary auth session so linking a new method
// never overwrites the existing session.

const LINKED_TG_KEY = 'castar_linked_telegram';
const LINKED_PHONE_KEY = 'castar_linked_phone';
const LINKED_EMAIL_KEY = 'castar_linked_email';

/** Save linked Telegram user data. */
export async function persistLinkedTelegram(user: TelegramUser): Promise<void> {
  await SecureStore.setItemAsync(LINKED_TG_KEY, JSON.stringify(user));
}

/** Read linked Telegram user data. Returns null if not linked. */
export async function getLinkedTelegram(): Promise<TelegramUser | null> {
  const raw = await SecureStore.getItemAsync(LINKED_TG_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as TelegramUser; } catch { return null; }
}

/** Save linked phone number. */
export async function persistLinkedPhone(phone: string): Promise<void> {
  await SecureStore.setItemAsync(LINKED_PHONE_KEY, phone);
}

/** Read linked phone number. Returns null if not linked. */
export async function getLinkedPhone(): Promise<string | null> {
  return SecureStore.getItemAsync(LINKED_PHONE_KEY);
}

/** Save linked email address. */
export async function persistLinkedEmail(email: string): Promise<void> {
  await SecureStore.setItemAsync(LINKED_EMAIL_KEY, email);
}

/** Read linked email address. Returns null if not linked. */
export async function getLinkedEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(LINKED_EMAIL_KEY);
}

/** Clear all linked account data (called on full account reset). */
export async function clearLinkedAccounts(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(LINKED_TG_KEY),
    SecureStore.deleteItemAsync(LINKED_PHONE_KEY),
    SecureStore.deleteItemAsync(LINKED_EMAIL_KEY),
  ]);
}
