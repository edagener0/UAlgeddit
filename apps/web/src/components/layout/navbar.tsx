import {
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-classes';
import { Dropdown, menuItemClasses } from '@/components/ui/dropdown';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';
import { useTheme } from '@/hooks/use-theme';

function SearchBox() {
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
        aria-label="Search posts"
        placeholder="Search UAlgeddit"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 w-full rounded-full border border-transparent bg-surface-muted pr-4 pl-10 text-sm focus:border-brand-500 focus:bg-surface focus:outline-none"
      />
    </form>
  );
}

export function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={onOpenMenu}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="UAlgeddit home">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-500 text-xl font-extrabold text-white">
            g
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight sm:inline">
            UAlg<span className="text-brand-500">eddit</span>
          </span>
        </Link>

        <div className="flex flex-1 justify-center">
          <SearchBox />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={toggle}
          >
            {theme === 'dark' ? (
              <Sun className="size-5" aria-hidden />
            ) : (
              <Moon className="size-5" aria-hidden />
            )}
          </Button>
          {isLoading ? null : user ? (
            <>
              <Link
                to="/chat"
                aria-label="Global chat"
                className={buttonClasses('ghost', 'icon', 'hidden sm:inline-flex')}
              >
                <MessagesSquare className="size-5" aria-hidden />
              </Link>
              <Link to="/submit" className={buttonClasses('ghost', 'md', 'hidden sm:inline-flex')}>
                <Plus className="size-5" aria-hidden />
                Create
              </Link>
              <Dropdown
                trigger={({ open, toggle: toggleMenu }) => (
                  <button
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggleMenu}
                    className="rounded-full ring-2 ring-transparent transition hover:ring-line"
                  >
                    <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-xs text-fg-muted">Signed in as</p>
                      <p className="truncate font-semibold">u/{user.username}</p>
                    </div>
                    <Link
                      role="menuitem"
                      to={`/u/${user.username}`}
                      onClick={close}
                      className={menuItemClasses}
                    >
                      <User className="size-4" aria-hidden /> Profile
                    </Link>
                    <Link role="menuitem" to="/friends" onClick={close} className={menuItemClasses}>
                      <Users className="size-4" aria-hidden /> Friends
                    </Link>
                    <Link
                      role="menuitem"
                      to="/settings/profile"
                      onClick={close}
                      className={menuItemClasses}
                    >
                      <Settings className="size-4" aria-hidden /> Edit profile
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
                      <LogOut className="size-4" aria-hidden /> Log out
                    </button>
                  </>
                )}
              </Dropdown>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('primary', 'md', 'hidden sm:inline-flex')}>
                Log in
              </Link>
              <Link
                to="/login"
                aria-label="Log in"
                className={buttonClasses('primary', 'icon', 'sm:hidden')}
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
