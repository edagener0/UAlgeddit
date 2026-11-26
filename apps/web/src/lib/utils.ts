import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { currentLocale } from '@/i18n';

/** Merges conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Intl formatters are relatively expensive to build, so cache one per locale. */
function cached<T>(factory: (locale: string) => T) {
  const cache = new Map<string, T>();
  return (locale: string = currentLocale()) => {
    let value = cache.get(locale);
    if (!value) {
      value = factory(locale);
      cache.set(locale, value);
    }
    return value;
  };
}

const relative = cached(
  (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }),
);
const compact = cached(
  (locale) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
);

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** Localised relative time: "3 hr. ago", "há 3 h", "il y a 3 h"... */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative().format(Math.round(seconds / size), unit);
  }
  return relative().format(0, 'second');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(currentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** 1234 -> "1.2K" (localised). */
export function formatCount(value: number): string {
  return Math.abs(value) < 1000 ? String(value) : compact().format(value);
}
