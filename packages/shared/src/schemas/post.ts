import { z } from 'zod';
import { idSchema, paginationQuerySchema, type ImageDto, type UserSummary } from './common.js';

export const postSortSchema = z.enum(['hot', 'new', 'top']);
export type PostSort = z.infer<typeof postSortSchema>;

export const createPostSchema = z.object({
  subgedditId: idSchema,
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(300, 'Title must be at most 300 characters'),
  content: z.string().trim().max(40_000, 'Content must be at most 40000 characters').default(''),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300).optional(),
  content: z.string().trim().max(40_000).optional(),
});
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = paginationQuerySchema.extend({
  sort: postSortSchema.default('hot'),
  subgeddit: z.string().trim().max(21).optional(),
  author: z.string().trim().max(20).optional(),
  q: z.string().trim().max(100).optional(),
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export interface PostDto {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  commentCount: number;
  /** The current user's vote on this post (0 when not voted or anonymous). */
  myVote: -1 | 0 | 1;
  images: ImageDto[];
  author: UserSummary;
  subgeddit: { id: number; name: string; iconUrl: string | null };
}
