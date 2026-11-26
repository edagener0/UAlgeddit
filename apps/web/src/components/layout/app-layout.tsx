import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration } from 'react-router';
import { Button } from '@/components/ui/button';
import { Navbar } from './navbar';
import { SidebarContent } from './sidebar';

export function AppLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded bg-brand-500 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('nav.skip')}
      </a>
      <Navbar onOpenMenu={() => setMenuOpen(true)} />

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.menu')}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-surface p-3 shadow-2xl">
            <div className="mb-3 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('nav.closeMenu')}
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-3 sm:px-4">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 scrollbar-none max-h-[calc(100dvh-4rem)] overflow-y-auto py-4">
            <SidebarContent />
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 py-4 sm:py-6">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </>
  );
}
