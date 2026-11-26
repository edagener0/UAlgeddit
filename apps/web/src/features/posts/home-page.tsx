import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { CommunityList } from '../subgeddits/community-list';
import { useCurrentUser } from '../auth/hooks';
import { PostFeed, SortBar } from './post-feed';
import { useSortParam } from './use-sort-param';

function AboutCard() {
  const { user } = useCurrentUser();
  return (
    <Card className="overflow-hidden">
      <div className="h-14 bg-gradient-to-r from-brand-500 to-orange-400" />
      <div className="space-y-3 p-4">
        <h2 className="font-bold">Home</h2>
        <p className="text-sm text-fg-muted">
          Your front page of UAlgeddit. Browse posts from every community, vote on what you like and
          join the discussion.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to={user ? '/submit' : '/login'}
            className={buttonClasses('primary', 'md', 'w-full')}
          >
            Create post
          </Link>
          <Link
            to={user ? '/g/new' : '/login'}
            className={buttonClasses('outline', 'md', 'w-full')}
          >
            Create community
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const [sort, setSort] = useSortParam();
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() || undefined;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-3">
        {q && (
          <h1 className="text-xl font-bold">
            Results for <span className="text-brand-600">&ldquo;{q}&rdquo;</span>
          </h1>
        )}
        <div className="flex items-center justify-between gap-2">
          <SortBar sort={sort} onChange={setSort} />
          <Link to="/submit" className={buttonClasses('primary', 'sm', 'lg:hidden')}>
            <Plus className="size-4" aria-hidden />
            Post
          </Link>
        </div>
        <PostFeed
          filters={{ sort, q }}
          emptyTitle={q ? 'No matching posts' : 'No posts yet'}
          emptyDescription={q ? 'Try different keywords.' : 'Be the first to share something!'}
        />
      </div>
      <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
        <AboutCard />
        <Card className="py-3">
          <h2 className="px-4 pb-2 text-xs font-bold tracking-wider text-fg-muted uppercase">
            Popular communities
          </h2>
          <CommunityList limit={6} />
          <Link
            to="/g"
            className="block px-4 pt-2 text-sm font-semibold text-brand-600 hover:underline"
          >
            See all
          </Link>
        </Card>
      </aside>
    </div>
  );
}
