import { z } from 'zod';
import { paginationQuerySchema, type UserSummary } from './common.js';

export const subgedditNameSchema = z
  .string()
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(21, 'Name must be at most 21 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and "_" are allowed');

export const createSubgedditSchema = z.object({
  name: subgedditNameSchema,
  description: z.string().trim().max(500, 'Description must be at most 500 characters').default(''),
});
export type CreateSubgedditInput = z.infer<typeof createSubgedditSchema>;

export const updateSubgedditSchema = z.object({
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
  /** Multipart flags ("true") to remove the current icon / banner without replacing it. */
  removeIcon: z.stringbool().optional(),
  removeBanner: z.stringbool().optional(),
});
export type UpdateSubgedditInput = z.infer<typeof updateSubgedditSchema>;

export const subgedditNameParamsSchema = z.object({ name: z.string().min(1).max(21) });

export const listSubgedditsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(50).optional(),
});
export type ListSubgedditsQuery = z.infer<typeof listSubgedditsQuerySchema>;

export interface SubgedditDto {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  owner: UserSummary;
  postCount: number;
}
