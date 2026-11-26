import { Link } from 'react-router';
import { SubgedditIcon } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/feedback';
import { pluralize } from '@/lib/utils';
import { useSubgeddits } from './hooks';

/** "Popular communities" list used by the sidebars. */
export function CommunityList({
  limit = 8,
  onNavigate,
}: {
  limit?: number;
  onNavigate?: () => void;
}) {
  const { data, isPending } = useSubgeddits({ pageSize: limit });
  if (isPending) {
    return (
      <div className="space-y-2 px-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-0.5">
      {data?.items.map((subgeddit) => (
        <li key={subgeddit.id}>
          <Link
            to={`/g/${subgeddit.name}`}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-muted"
          >
            <SubgedditIcon src={subgeddit.iconUrl} name={subgeddit.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">g/{subgeddit.name}</span>
              <span className="block text-xs text-fg-muted">
                {pluralize(subgeddit.postCount, 'post')}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
