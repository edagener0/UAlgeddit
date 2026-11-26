import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { SubgedditIcon } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Input } from '@/components/ui/field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { pluralize } from '@/lib/utils';
import { useCurrentUser } from '../auth/hooks';
import { useSubgeddits } from './hooks';

export function SubgedditsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim());
  const { user } = useCurrentUser();
  const list = useSubgeddits({ q: q || undefined, page, pageSize: 24 });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-fg-muted">Find a place for every topic.</p>
        </div>
        <Link to={user ? '/g/new' : '/login'} className={buttonClasses('primary', 'md')}>
          <Plus className="size-4" aria-hidden />
          Create community
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search communities"
          placeholder="Search communities"
          className="pl-10"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {list.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="No communities found"
          description={q ? 'Try another search.' : 'Create the first one!'}
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.data.items.map((subgeddit) => (
              <li key={subgeddit.id}>
                <Link to={`/g/${subgeddit.name}`} className="block h-full">
                  <Card className="h-full overflow-hidden transition-colors hover:border-fg-muted/40">
                    <div
                      className="h-16 bg-gradient-to-r from-brand-500 to-orange-300 bg-cover bg-center"
                      style={
                        subgeddit.bannerUrl
                          ? { backgroundImage: `url("${subgeddit.bannerUrl}")` }
                          : undefined
                      }
                    />
                    <div className="-mt-6 space-y-2 px-4 pb-4">
                      <SubgedditIcon
                        src={subgeddit.iconUrl}
                        name={subgeddit.name}
                        size="lg"
                        className="border-4 border-surface"
                      />
                      <div>
                        <h2 className="font-bold">g/{subgeddit.name}</h2>
                        <p className="text-xs text-fg-muted">
                          {pluralize(subgeddit.postCount, 'post')}
                        </p>
                      </div>
                      {subgeddit.description && (
                        <p className="line-clamp-2 text-sm text-fg-muted">
                          {subgeddit.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {list.data.totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-fg-muted">
                Page {list.data.page} of {list.data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= list.data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
