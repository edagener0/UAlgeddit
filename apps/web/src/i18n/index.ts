import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]['code'];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, pt, fr },
    supportedLngs: LANGUAGES.map((language) => language.code),
    // "pt-BR" -> "pt", "fr-CA" -> "fr"; anything unsupported -> English.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation', 'messages'],
    interpolation: { escapeValue: false }, // React already escapes.
    detection: {
      // A language picked in the UI wins; otherwise use the browser language.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    returnNull: false,
  });

const syncDocument = (language: string) => {
  document.documentElement.lang = language;
};
syncDocument(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', syncDocument);

/** Current locale for Intl formatters. */
export const currentLocale = () => i18n.resolvedLanguage ?? 'en';

/**
 * Translates an English message coming from the API or the shared zod schemas
 * (they are the keys of the `messages` namespace); unknown messages pass through.
 */
export function translateMessage(message: string): string {
  return i18n.t(message, {
    ns: 'messages',
    keySeparator: false,
    nsSeparator: false,
    defaultValue: message,
  });
}

export default i18n;
