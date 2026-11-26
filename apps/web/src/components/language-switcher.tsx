import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dropdown, menuItemClasses } from '@/components/ui/dropdown';
import { LANGUAGES } from '@/i18n';

/** Globe menu to switch between English, Portuguese and French (remembered locally). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <Dropdown
      className="min-w-40"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-label={t('language.label')}
          title={t('language.label')}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
          className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-xs font-bold text-fg-muted uppercase transition-colors hover:bg-surface-muted hover:text-fg"
        >
          <Languages className="size-5" aria-hidden />
          <span className="hidden sm:inline">{current}</span>
        </button>
      )}
    >
      {(close) =>
        LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            role="menuitemradio"
            aria-checked={current === code}
            type="button"
            lang={code}
            className={menuItemClasses}
            onClick={() => {
              void i18n.changeLanguage(code);
              close();
            }}
          >
            <span className="flex-1">{label}</span>
            {current === code && <Check className="size-4 text-brand-500" aria-hidden />}
          </button>
        ))
      }
    </Dropdown>
  );
}
