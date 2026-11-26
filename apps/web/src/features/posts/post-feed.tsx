import type { PostSort } from '@ualgeddit/shared';
import { Clock, Flame, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import type { PostFilters } from './api';
import { PostCard } from './post-card';
import { usePostFeed } from './hooks';

const SORTS = [
  { value: 'hot', label: 'Hot', icon: <Flame className="size-4" aria-hidden /> },
  { value: 'new', label: 'New', icon: <Clock className="size-4" aria-hidden /> },
  { value: 'top', label: 'Top', icon: <Trophy className="size-4" aria-hidden /> },
] satisfies { value: PostSort; label: string; icon: React.ReactNode }[];

export function SortBar({
  sort,
  onChange,
}: {
  sort: PostSort;
  onChange: (sort: PostSort) => void;
}) {
  return <Segmented label="Sort posts" options={SORTS} value={sort} onChange={onChange} />;
}

export function PostSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-48" />
    </div>
  );
}

interface PostFeedProps {
  filters: PostFilters;
  hideSubgeddit?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Infinite list of posts; loads the next page when the sentinel scrolls into view. */
export function PostFeed({
  filters,
  hideSubgeddit,
  emptyTitle = 'No posts yet',
  emptyDescription,
}: PostFeedProps) {
  const feed = usePostFeed(filters);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending) {
    return (
      <div className="space-y-3">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }
  if (feed.isError) return <ErrorState error={feed.error} onRetry={() => void feed.refetch()} />;

  const posts = feed.data.pages.flatMap((page) => page.items);
  if (posts.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} hideSubgeddit={hideSubgeddit} />
      ))}
      <div ref={sentinel} />
      {hasNextPage && (
        <div className="flex justify-center py-2">
          <Button
            variant="outline"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
