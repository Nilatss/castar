/**
 * i18n configuration — lazy language loading.
 *
 * At startup only the detected device language + English fallback are parsed.
 * Other languages are loaded on demand via ensureLanguageLoaded() when the
 * user switches. This avoids parsing ~490KB of JSON at startup (11 languages).
 *
 * Metro bundles all `require()` targets statically, but module factory
 * evaluation (JSON parsing) is deferred until the `require()` call executes.
 * Wrapping `require()` inside lambdas exploits this: the JSON is in the
 * bundle but isn't parsed until the lambda is invoked.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// ═══════════════════════════════════════════════
// Lazy loaders — JSON is NOT parsed until the lambda runs
// ═══════════════════════════════════════════════

const LAZY_LOADERS: Record<string, () => any> = {
  en: () => require('./en.json'),
  ru: () => require('./ru.json'),
  uz: () => require('./uz.json'),
  be: () => require('./be.json'),
  uk: () => require('./uk.json'),
  kk: () => require('./kk.json'),
  de: () => require('./de.json'),
  az: () => require('./az.json'),
  pl: () => require('./pl.json'),
  ka: () => require('./ka.json'),
  zh: () => require('./zh.json'),
};

export const SUPPORTED_LANGS = Object.keys(LAZY_LOADERS);

// Track which languages have been loaded
const loadedLangs = new Set<string>();

// ═══════════════════════════════════════════════
// Detect device language
// ═══════════════════════════════════════════════

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
const detectedLang = SUPPORTED_LANGS.includes(deviceLang) ? deviceLang : 'en';

// ═══════════════════════════════════════════════
// Load only detected language + fallback (en) at startup
// ═══════════════════════════════════════════════

const initialResources: Record<string, { translation: any }> = {};

// Always load English (fallback)
initialResources.en = { translation: LAZY_LOADERS.en() };
loadedLangs.add('en');

// Load detected language if different from English
if (detectedLang !== 'en') {
  initialResources[detectedLang] = { translation: LAZY_LOADERS[detectedLang]() };
  loadedLangs.add(detectedLang);
}

// ═══════════════════════════════════════════════
// Initialize i18next with minimal resources
// ═══════════════════════════════════════════════

i18n.use(initReactI18next).init({
  resources: initialResources,
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

// ═══════════════════════════════════════════════
// On-demand language loading
// ═══════════════════════════════════════════════

/**
 * Ensures a language bundle is loaded before switching to it.
 * Call this before `i18n.changeLanguage(lang)` — it's a no-op if already loaded.
 */
export function ensureLanguageLoaded(lang: string): void {
  if (loadedLangs.has(lang)) return;

  const loader = LAZY_LOADERS[lang];
  if (!loader) return;

  const resource = loader();
  i18n.addResourceBundle(lang, 'translation', resource, true, true);
  loadedLangs.add(lang);
}

export default i18n;
