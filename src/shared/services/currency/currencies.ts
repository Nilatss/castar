/**
 * Castar — Supported currencies
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  nameUz: string;
  nameRu: string;
  symbol: string;
  flag: string;
}

export const currencies: CurrencyInfo[] = [
  { code: 'UZS', name: 'Uzbekistani Sum', nameUz: "O'zbek so'mi", nameRu: 'Узбекский сум', symbol: "so'm", flag: '🇺🇿' },
  { code: 'USD', name: 'US Dollar', nameUz: 'AQSh dollari', nameRu: 'Доллар США', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameUz: 'Yevro', nameRu: 'Евро', symbol: '€', flag: '🇪🇺' },
  { code: 'RUB', name: 'Russian Ruble', nameUz: 'Rus rubli', nameRu: 'Российский рубль', symbol: '₽', flag: '🇷🇺' },
  { code: 'GBP', name: 'British Pound', nameUz: 'Britaniya funti', nameRu: 'Британский фунт', symbol: '£', flag: '🇬🇧' },
  { code: 'TRY', name: 'Turkish Lira', nameUz: 'Turk lirasi', nameRu: 'Турецкая лира', symbol: '₺', flag: '🇹🇷' },
  { code: 'KZT', name: 'Kazakhstani Tenge', nameUz: "Qozog'iston tengesi", nameRu: 'Казахстанский тенге', symbol: '₸', flag: '🇰🇿' },
];

export function getCurrencyByCode(code: string): CurrencyInfo | undefined {
  return currencies.find((c) => c.code === code);
}
