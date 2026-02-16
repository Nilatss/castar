/**
 * CaStar — App Configuration
 */

export const APP_CONFIG = {
  name: 'CaStar',
  version: '1.0.0',
  defaultCurrency: 'UZS',
  defaultLanguage: 'uz',
  supportedLanguages: ['uz', 'ru', 'en'] as const,
  supportedCurrencies: ['UZS', 'USD', 'EUR', 'RUB'] as const,
  currencyUpdateIntervalMs: 60 * 60 * 1000, // 1 hour
  maxSyncRetries: 3,
} as const;

export type SupportedLanguage = (typeof APP_CONFIG.supportedLanguages)[number];
export type SupportedCurrency = (typeof APP_CONFIG.supportedCurrencies)[number];
