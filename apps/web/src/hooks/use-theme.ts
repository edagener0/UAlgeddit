import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const REVEAL_MS = 600;

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Light/dark theme with an animated switch:
 * - View Transitions API: a circular reveal expanding from the toggle button (composited, 60fps);
 * - otherwise: a short colour cross-fade;
 * - `prefers-reduced-motion`: instant.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  // Follow the OS preference until the user picks a theme explicitly.
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) => {
      if (readStored()) return;
      const next: Theme = event.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(
    (event?: MouseEvent<HTMLElement>) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable (private mode); the theme still applies for this visit.
      }

      const commit = () => {
        applyTheme(next);
        flushSync(() => setTheme(next));
      };

      if (prefersReducedMotion()) {
        commit();
        return;
      }

      if (!document.startViewTransition) {
        const root = document.documentElement;
        root.classList.add('theme-fade');
        commit();
        window.setTimeout(() => root.classList.remove('theme-fade'), 350);
        return;
      }

      // Circle grows from the button (or the top-right corner when triggered without a click).
      const rect = event?.currentTarget.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
      const y = rect ? rect.top + rect.height / 2 : 0;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(commit);
      void transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: REVEAL_MS,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
    },
    [theme],
  );

  return { theme, toggle };
}
