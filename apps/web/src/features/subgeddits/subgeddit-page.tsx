import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Avatar, SubgedditIcon } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { ApiError, errorMessage } from '@/lib/api-client';
import { formatCount, formatDate } from '@/lib/utils';
import { NotFoundPage } from '@/pages/not-found-page';
import { useCurrentUser } from '../auth/hooks';
import { PostFeed, SortBar } from '../posts/post-feed';
import { useSortParam } from '../posts/use-sort-param';
import { useDeleteSubgeddit, useSubgeddit } from './hooks';

export function SubgedditPage() {
  const { t } = useTranslation();
  const name = useParams().name ?? '';
  const subgeddit = useSubgeddit(name);
  const { user } = useCurrentUser();
  const [sort, setSort] = useSortParam();
  const remove = useDeleteSubgeddit();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (subgeddit.isError) {
    if (subgeddit.error instanceof ApiError && subgeddit.error.status === 404)
      return <NotFoundPage />;
    return <ErrorState error={subgeddit.error} onRetry={() => void subgeddit.refetch()} />;
  }
  if (subgeddit.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl sm:h-44" />
        <Skeleton className="h-8 w-60" />
      </div>
    );
  }

  const data = subgeddit.data;
  const isOwner = user?.id === data.owner.id;

  return (
    <div className="space-y-5">
      <header>
        <div
          className="h-28 rounded-2xl bg-gradient-to-r from-brand-500 to-orange-300 bg-cover bg-center sm:h-44"
          style={data.bannerUrl ? { backgroundImage: `url("${data.bannerUrl}")` } : undefined}
          role="img"
          aria-label={t('communities.bannerLabel', { name: data.name })}
        />
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-end sm:justify-between sm:px-4">
          <div className="-mt-8 flex items-end gap-3 sm:-mt-10">
            <SubgedditIcon
              src={data.iconUrl}
              name={data.name}
              size="xl"
              className="size-20 border-4 border-canvas sm:size-24"
            />
            <h1 className="pb-1 text-2xl font-bold break-all sm:text-3xl">g/{data.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={user ? `/submit?g=${data.name}` : '/login'}
              className={buttonClasses('primary', 'md')}
            >
              <Plus className="size-4" aria-hidden />
              {t('common.createPost')}
            </Link>
            {isOwner && (
              <>
                <Link to={`/g/${data.name}/edit`} className={buttonClasses('outline', 'md')}>
                  <Pencil className="size-4" aria-hidden />
                  {t('common.edit')}
                </Link>
                <Button
                  variant="outline"
                  className="hover:text-red-600"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">{t('common.delete')}</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {data.description && (
          <p className="mt-3 px-2 text-sm whitespace-pre-line text-fg-muted sm:px-4 lg:hidden">
            {data.description}
          </p>
        )}
      </header>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <SortBar sort={sort} onChange={setSort} />
          <PostFeed
            filters={{ sort, subgeddit: data.name }}
            hideSubgeddit
            emptyTitle={t('communities.emptyPosts')}
            emptyDescription={t('communities.emptyPostsHint')}
          />
        </div>
        <aside className="hidden w-80 shrink-0 lg:block">
          <Card className="sticky top-20 space-y-4 p-4">
            <h2 className="font-bold">{t('communities.about', { name: data.name })}</h2>
            <p className="text-sm whitespace-pre-line text-fg-muted">
              {data.description || t('communities.noDescription')}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-bold">{formatCount(data.postCount)}</dt>
                <dd className="text-fg-muted">{t('communities.posts')}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 font-bold">
                  <CalendarDays className="size-4" aria-hidden />
                  {formatDate(data.createdAt)}
                </dt>
                <dd className="text-fg-muted">{t('communities.created')}</dd>
              </div>
            </dl>
            <div className="border-t border-line pt-3">
              <h3 className="mb-2 text-xs font-bold tracking-wider text-fg-muted uppercase">
                {t('communities.moderator')}
              </h3>
              <Link
                to={`/u/${data.owner.username}`}
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Avatar src={data.owner.avatarUrl} name={data.owner.username} size="sm" />
                u/{data.owner.username}
              </Link>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t('communities.deleteTitle', { name: data.name })}
        description={t('communities.deleteDescription')}
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(data.name, {
            onSuccess: () => {
              toast.success(t('communities.deletedToast', { name: data.name }));
              void navigate('/g', { replace: true });
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </div>
  );
}
