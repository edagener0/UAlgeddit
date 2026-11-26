import type { Paginated, PaginationQuery } from '@ualgeddit/shared';

export function toSkipTake({ page, pageSize }: PaginationQuery) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationQuery,
): Paginated<T> {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
