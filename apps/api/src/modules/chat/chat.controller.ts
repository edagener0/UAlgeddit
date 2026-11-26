import { chatHistoryQuerySchema } from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import type { ChatService } from './chat.service.js';

export class ChatController {
  constructor(private readonly chat: ChatService) {}

  history = async (req: Request, res: Response) => {
    const { limit } = chatHistoryQuerySchema.parse(req.query);
    res.json(await this.chat.history(limit));
  };
}
