import { Cake, Pencil, Sparkles, Users } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/avatar';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api-client';
import { formatCount, formatDate } from '@/lib/utils';
import { NotFoundPage } from '@/pages/not-found-page';
import { PostFeed, SortBar } from '../posts/post-feed';
import { useSortParam } from '../posts/use-sort-param';
import { FriendButton } from './friend-button';
import { useUserProfile } from './hooks';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const username = useParams().username ?? '';
  const profile = useUserProfile(username);
  const [sort, setSort] = useSortParam();

  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) return <NotFoundPage />;
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }
  if (profile.isPending) return <Skeleton className="h-48 rounded-2xl" />;

  const user = profile.data;
  return (
    <div className="flex flex-col gap-6 lg:flex-row-reverse">
      <aside className="w-full shrink-0 lg:w-80">
        <Card className="overflow-hidden lg:sticky lg:top-20">
          <div className="h-20 bg-gradient-to-br from-brand-500 to-fuchsia-500" />
          <div className="-mt-10 space-y-4 px-4 pb-5">
            <Avatar
              src={user.avatarUrl}
              name={user.username}
              size="xl"
              className="border-4 border-surface"
            />
            <div>
              <h1 className="text-xl font-bold break-all">{user.username}</h1>
              <p className="text-sm text-fg-muted">u/{user.username}</p>
            </div>
            {user.bio && <p className="text-sm whitespace-pre-line">{user.bio}</p>}
            <dl className="grid grid-cols-2 gap-3">
              <Stat label={t('profile.karma')} value={formatCount(user.karma)} />
              <Stat label={t('profile.posts')} value={formatCount(user.postCount)} />
              <Stat label={t('profile.friends')} value={formatCount(user.friendCount)} />
              <Stat label={t('profile.joined')} value={formatDate(user.createdAt)} />
            </dl>
            {user.birthday && (
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <Cake className="size-4" aria-hidden />
                {t('profile.birthday', { date: formatDate(user.birthday) })}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {user.friendshipStatus === 'self' ? (
                <>
                  <Link to="/settings/profile" className={buttonClasses('outline', 'md')}>
                    <Pencil className="size-4" aria-hidden />
                    {t('nav.editProfile')}
                  </Link>
                  <Link to="/friends" className={buttonClasses('secondary', 'md')}>
                    <Users className="size-4" aria-hidden />
                    {t('nav.friends')}
                  </Link>
                </>
              ) : (
                <FriendButton profile={user} />
              )}
            </div>
          </div>
        </Card>
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-5 text-brand-500" aria-hidden />
            {t('profile.posts')}
          </h2>
          <SortBar sort={sort} onChange={setSort} />
        </div>
        <PostFeed
          filters={{ sort, author: user.username }}
          emptyTitle={t('profile.noPosts', { name: user.username })}
        />
      </div>
    </div>
  );
}
