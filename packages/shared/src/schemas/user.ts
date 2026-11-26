import { z } from 'zod';

export const updateProfileSchema = z.object({
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').nullable().optional(),
  birthday: z.iso
    .date('Birthday must be a valid date (YYYY-MM-DD)')
    .refine((value) => new Date(value) < new Date(), 'Birthday must be in the past')
    .nullable()
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const usernameParamsSchema = z.object({ username: z.string().min(1).max(20) });

export type FriendshipStatus = 'self' | 'none' | 'friends' | 'request_sent' | 'request_received';

export interface UserProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  birthday: string | null;
  karma: number;
  createdAt: string;
  friendCount: number;
  postCount: number;
  friendshipStatus: FriendshipStatus;
}
