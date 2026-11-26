import { Compass, Home, MessagesSquare, Plus, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { useCurrentUser } from '@/features/auth/hooks';
import { useFriendRequests } from '@/features/friends/hooks';
import { CommunityList } from '@/features/subgeddits/community-list';
import { cn } from '@/lib/utils';

function Item({
  to,
  icon,
  children,
  badge,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-surface-muted text-fg'
            : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
        )
      }
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge ? (
        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function FriendsItem({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const requests = useFriendRequests();
  return (
    <Item
      to="/friends"
      icon={<Users className="size-5" aria-hidden />}
      badge={requests.data?.received.length}
      onNavigate={onNavigate}
    >
      {t('nav.friends')}
    </Item>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  return (
    <nav aria-label={t('nav.main')} className="space-y-6">
      <div className="space-y-0.5">
        <Item to="/" icon={<Home className="size-5" aria-hidden />} onNavigate={onNavigate}>
          {t('nav.home')}
        </Item>
        <Item to="/g" icon={<Compass className="size-5" aria-hidden />} onNavigate={onNavigate}>
          {t('nav.explore')}
        </Item>
        {user && (
          <>
            <Item
              to="/chat"
              icon={<MessagesSquare className="size-5" aria-hidden />}
              onNavigate={onNavigate}
            >
              {t('nav.chat')}
            </Item>
            <FriendsItem onNavigate={onNavigate} />
          </>
        )}
      </div>
      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between px-3 pb-2">
          <h2 className="text-xs font-bold tracking-wider text-fg-muted uppercase">
            {t('nav.communities')}
          </h2>
          {user && (
            <NavLink
              to="/g/new"
              onClick={onNavigate}
              aria-label={t('common.createCommunity')}
              className="text-fg-muted hover:text-fg"
            >
              <Plus className="size-4" aria-hidden />
            </NavLink>
          )}
        </div>
        <CommunityList limit={10} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
