import { format, isToday, isYesterday, type Locale } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  uz: uz,
  ru: ru,
  en: enUS,
};

export function formatTransactionDate(
  timestamp: number,
  lang: string = 'uz'
): string {
  const date = new Date(timestamp);
  const locale = locales[lang] || enUS;

  if (isToday(date)) {
    return lang === 'ru' ? 'Сегодня' : lang === 'uz' ? 'Bugun' : 'Today';
  }

  if (isYesterday(date)) {
    return lang === 'ru' ? 'Вчера' : lang === 'uz' ? 'Kecha' : 'Yesterday';
  }

  return format(date, 'd MMMM yyyy', { locale });
}

export function formatShortDate(timestamp: number): string {
  return format(new Date(timestamp), 'dd.MM.yyyy');
}

export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm');
}
