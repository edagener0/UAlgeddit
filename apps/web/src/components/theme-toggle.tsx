import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

/** Sun/moon button whose icons rotate and scale into each other. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const dark = theme === 'dark';
  const icon =
    'absolute size-5 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t('theme.toLight') : t('theme.toDark')}
      title={dark ? t('theme.toLight') : t('theme.toDark')}
      className="relative inline-flex size-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
    >
      <Sun
        aria-hidden
        className={cn(
          icon,
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0',
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          icon,
          dark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
      />
    </button>
  );
}
