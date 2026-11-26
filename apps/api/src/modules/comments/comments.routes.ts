import { Router } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import type { CommentsController } from './comments.controller.js';

/** Routes addressed by comment id (`/comments/:id`). Post-scoped routes live in the posts router. */
export function createCommentsRouter(controller: CommentsController): Router {
  const router = Router();
  router.delete('/:id', requireAuth, controller.delete);
  router.put('/:id/vote', requireAuth, controller.vote);
  return router;
}
