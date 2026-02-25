/**
 * Safe wrapper for expo-local-authentication.
 *
 * expo-local-authentication requires a native build (expo prebuild / EAS Build).
 * In Expo Go the native module is missing and a top-level import crashes the app.
 * This module lazily requires the library and falls back gracefully when unavailable.
 */

type AuthResult = { success: boolean; error?: string };

let _LocalAuth: typeof import('expo-local-authentication') | null = null;
let _checked = false;

function getModule(): typeof import('expo-local-authentication') | null {
  if (!_checked) {
    _checked = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      _LocalAuth = require('expo-local-authentication');
    } catch {
      _LocalAuth = null;
    }
  }
  return _LocalAuth;
}

/** Whether the native module is available at runtime. */
export function isAvailable(): boolean {
  return getModule() !== null;
}

/** Device has biometric hardware (fingerprint sensor / Face ID). */
export async function hasHardwareAsync(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  try {
    return await mod.hasHardwareAsync();
  } catch {
    return false;
  }
}

/** At least one biometric (fingerprint / face) is enrolled on the device. */
export async function isEnrolledAsync(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  try {
    return await mod.isEnrolledAsync();
  } catch {
    return false;
  }
}

/** Show the system biometric prompt. Returns `{ success: true }` on success. */
export async function authenticateAsync(options?: {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}): Promise<AuthResult> {
  const mod = getModule();
  if (!mod) return { success: false, error: 'native_unavailable' };
  try {
    return await mod.authenticateAsync(options);
  } catch {
    return { success: false, error: 'exception' };
  }
}
