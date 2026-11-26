import { afterEach, describe, expect, it } from 'vitest';
import i18n, { translateMessage } from '.';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

/** Flattens nested translation objects into dotted keys. */
function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('i18n', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it.each([
    ['pt', pt],
    ['fr', fr],
  ])('the %s catalogue has exactly the same keys as English', (_lng, catalogue) => {
    expect(keys(catalogue).sort()).toEqual(keys(en).sort());
  });

  it.each([
    ['pt-BR', 'pt'],
    ['pt-PT', 'pt'],
    ['fr-CA', 'fr'],
    ['en-GB', 'en'],
    ['de-DE', 'en'],
    ['ja', 'en'],
  ])('resolves the browser language %s to %s', async (browser, expected) => {
    await i18n.changeLanguage(browser);
    expect(i18n.resolvedLanguage).toBe(expected);
  });

  it('translates UI strings', async () => {
    await i18n.changeLanguage('pt');
    expect(i18n.t('nav.home')).toBe('Início');
    await i18n.changeLanguage('fr');
    expect(i18n.t('nav.home')).toBe('Accueil');
  });

  it('translates API / validation messages and passes unknown ones through', async () => {
    await i18n.changeLanguage('fr');
    expect(translateMessage('Passwords do not match')).toBe(
      'Les mots de passe ne correspondent pas',
    );
    expect(translateMessage('Some brand new server message: 42')).toBe(
      'Some brand new server message: 42',
    );
  });

  it('keeps the <html lang> attribute in sync', async () => {
    await i18n.changeLanguage('pt');
    expect(document.documentElement.lang).toBe('pt');
  });
});
