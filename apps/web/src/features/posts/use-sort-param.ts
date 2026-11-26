import type { PostSort } from '@ualgeddit/shared';
import { useSearchParams } from 'react-router';

const isSort = (value: string | null): value is PostSort =>
  value === 'hot' || value === 'new' || value === 'top';

/** Sort state persisted in the URL (`?sort=top`). */
export function useSortParam(): [PostSort, (sort: PostSort) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('sort');
  const sort = isSort(raw) ? raw : 'hot';
  const setSort = (next: PostSort) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === 'hot') copy.delete('sort');
        else copy.set('sort', next);
        return copy;
      },
      { replace: true },
    );
  return [sort, setSort];
}
