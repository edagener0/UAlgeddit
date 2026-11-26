import {
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-classes';
import { Dropdown, menuItemClasses } from '@/components/ui/dropdown';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

function SearchBox() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const navigate = useNavigate();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    void navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/');
  };
  return (
    <form role="search" onSubmit={submit} className="relative w-full max-w-xl">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted"
        aria-hidden
      />
      <input
        type="search"
        aria-label={t('nav.searchLabel')}
        placeholder={t('nav.search')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 w-full rounded-full border border-transparent bg-surface-muted pr-4 pl-10 text-sm focus:border-brand-500 focus:bg-surface focus:outline-none"
      />
    </form>
  );
}

export function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t('nav.openMenu')}
          onClick={onOpenMenu}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={t('nav.homeLabel')}>
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-500 text-xl font-extrabold text-white">
            g
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight sm:inline">
            UAlg<span className="text-brand-500">eddit</span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBox />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {isLoading ? null : user ? (
            <>
              <Link
                to="/chat"
                aria-label={t('nav.chat')}
                className={buttonClasses('ghost', 'icon', 'hidden sm:inline-flex')}
              >
                <MessagesSquare className="size-5" aria-hidden />
              </Link>
              <Link to="/submit" className={buttonClasses('ghost', 'md', 'hidden md:inline-flex')}>
                <Plus className="size-5" aria-hidden />
                {t('nav.create')}
              </Link>
              <Dropdown
                trigger={({ open, toggle }) => (
                  <button
                    type="button"
                    aria-label={t('nav.account')}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggle}
                    className="ml-1 rounded-full ring-2 ring-transparent transition hover:ring-line"
                  >
                    <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-xs text-fg-muted">{t('nav.signedInAs')}</p>
                      <p className="truncate font-semibold">u/{user.username}</p>
                    </div>
                    <Link
                      role="menuitem"
                      to={`/u/${user.username}`}
                      onClick={close}
                      className={menuItemClasses}
                    >
                      <User className="size-4" aria-hidden /> {t('nav.profile')}
                    </Link>
                    <Link role="menuitem" to="/friends" onClick={close} className={menuItemClasses}>
                      <Users className="size-4" aria-hidden /> {t('nav.friends')}
                    </Link>
                    <Link
                      role="menuitem"
                      to="/settings/profile"
                      onClick={close}
                      className={menuItemClasses}
                    >
                      <Settings className="size-4" aria-hidden /> {t('nav.editProfile')}
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      className={menuItemClasses}
                      onClick={() => {
                        close();
                        logout.mutate();
                      }}
                    >
                      <LogOut className="size-4" aria-hidden /> {t('nav.logOut')}
                    </button>
                  </>
                )}
              </Dropdown>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={buttonClasses('primary', 'md', 'ml-1 hidden sm:inline-flex')}
              >
                {t('common.logIn')}
              </Link>
              <Link
                to="/login"
                aria-label={t('common.logIn')}
                className={buttonClasses('primary', 'icon', 'ml-1 sm:hidden')}
              >
                <LogIn className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
