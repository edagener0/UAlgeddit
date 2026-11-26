import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

/** A positive integer identifier coming from a URL path segment. */
export const idSchema = z.coerce.number().int().positive();

export const idParamsSchema = z.object({ id: idSchema });
export type IdParams = z.infer<typeof idParamsSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Generic envelope for paginated list responses. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Shape of every error response returned by the API. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}

/** Vote direction: 1 = upvote, -1 = downvote, 0 = remove vote. */
export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
});
export type VoteInput = z.infer<typeof voteSchema>;
export type VoteValue = VoteInput['value'];

export interface ImageDto {
  id: number;
  url: string;
  position: number;
}

export interface UserSummary {
  id: number;
  username: string;
  avatarUrl: string | null;
}
