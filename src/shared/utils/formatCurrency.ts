import type { Currency } from '../types';

const currencySymbols: Record<string, string> = {
  UZS: "so'm",
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

const currencyLocales: Record<string, string> = {
  UZS: 'uz-UZ',
  USD: 'en-US',
  EUR: 'de-DE',
  RUB: 'ru-RU',
};

export function formatCurrency(
  amount: number,
  currency: Currency = 'UZS',
  compact = false
): string {
  const locale = currencyLocales[currency] || 'en-US';

  if (compact && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toFixed(1)}M ${currencySymbols[currency] || currency}`;
  }

  if (compact && Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000;
    return `${thousands.toFixed(1)}K ${currencySymbols[currency] || currency}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${currencySymbols[currency] || currency}`;
}
