import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '../auth/hooks';
import { CommunityList } from '../subgeddits/community-list';
import { PostFeed, SortBar } from './post-feed';
import { useSortParam } from './use-sort-param';

function AboutCard() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  return (
    <Card className="overflow-hidden">
      <div className="h-14 bg-gradient-to-r from-brand-500 to-orange-400" />
      <div className="space-y-3 p-4">
        <h2 className="font-bold">{t('home.title')}</h2>
        <p className="text-sm text-fg-muted">{t('home.about')}</p>
        <div className="flex flex-col gap-2">
          <Link
            to={user ? '/submit' : '/login'}
            className={buttonClasses('primary', 'md', 'w-full')}
          >
            {t('common.createPost')}
          </Link>
          <Link
            to={user ? '/g/new' : '/login'}
            className={buttonClasses('outline', 'md', 'w-full')}
          >
            {t('common.createCommunity')}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [sort, setSort] = useSortParam();
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() || undefined;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-3">
        {q && (
          <h1 className="text-xl font-bold">
            {t('feed.resultsFor')} <span className="text-brand-600">&ldquo;{q}&rdquo;</span>
          </h1>
        )}
        <div className="flex items-center justify-between gap-2">
          <SortBar sort={sort} onChange={setSort} />
          <Link to="/submit" className={buttonClasses('primary', 'sm', 'lg:hidden')}>
            <Plus className="size-4" aria-hidden />
            {t('common.post')}
          </Link>
        </div>
        <PostFeed
          filters={{ sort, q }}
          emptyTitle={q ? t('feed.noResults') : t('home.welcomeTitle')}
          emptyDescription={q ? t('feed.noResultsHint') : t('home.welcomeText')}
          emptyAction={
            q ? undefined : (
              <Link to={user ? '/g/new' : '/register'} className={buttonClasses('primary', 'md')}>
                {t('common.createCommunity')}
              </Link>
            )
          }
        />
      </div>
      <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
        <AboutCard />
        <Card className="py-3">
          <h2 className="px-4 pb-2 text-xs font-bold tracking-wider text-fg-muted uppercase">
            {t('home.popular')}
          </h2>
          <CommunityList limit={6} />
          <Link
            to="/g"
            className="block px-4 pt-2 text-sm font-semibold text-brand-600 hover:underline"
          >
            {t('common.seeAll')}
          </Link>
        </Card>
      </aside>
    </div>
  );
}
