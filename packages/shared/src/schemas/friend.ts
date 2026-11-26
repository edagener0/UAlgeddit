import { z } from 'zod';
import { usernameSchema } from './auth.js';
import type { UserSummary } from './common.js';

export const sendFriendRequestSchema = z.object({ username: usernameSchema });
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

export interface FriendRequestDto {
  from: UserSummary;
  createdAt: string;
}

export interface FriendDto extends UserSummary {
  since: string;
}
