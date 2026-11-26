import { z } from 'zod';
import { idSchema, type ImageDto, type UserSummary } from './common.js';

export const createCommentSchema = z.object({
  content: z.string().trim().max(10_000, 'Comment must be at most 10000 characters').default(''),
  parentId: idSchema.optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentSortSchema = z.enum(['top', 'new', 'old']);
export type CommentSort = z.infer<typeof commentSortSchema>;

export const listCommentsQuerySchema = z.object({
  sort: commentSortSchema.default('top'),
});

export interface CommentDto {
  id: number;
  postId: number;
  parentId: number | null;
  /** Empty when the comment was deleted but still has replies. */
  content: string;
  deleted: boolean;
  createdAt: string;
  score: number;
  myVote: -1 | 0 | 1;
  /** `null` when the comment was deleted. */
  author: UserSummary | null;
  images: ImageDto[];
  replies: CommentDto[];
}
