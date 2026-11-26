import { Router } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import type { ChatController } from './chat.controller.js';

export function createChatRouter(controller: ChatController): Router {
  const router = Router();
  router.get('/messages', requireAuth, controller.history);
  return router;
}
