import { z } from 'zod';
import type { UserSummary } from './common.js';

export const chatMessageContentSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message must be at most 1000 characters');

/** Messages a client may send over the chat WebSocket. */
export const chatClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message'), content: chatMessageContentSchema }),
]);
export type ChatClientEvent = z.infer<typeof chatClientEventSchema>;

export interface ChatMessageDto {
  id: number;
  content: string;
  createdAt: string;
  author: UserSummary;
}

/** Messages the server pushes over the chat WebSocket. */
export type ChatServerEvent =
  | { type: 'message'; data: ChatMessageDto }
  | { type: 'presence'; online: number }
  | { type: 'error'; message: string };

export const chatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
