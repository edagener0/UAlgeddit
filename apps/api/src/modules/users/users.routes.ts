import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import { avatarUpload } from '../../common/middleware/upload.js';
import type { UsersController } from './users.controller.js';

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.patch('/me', requireAuth, controller.updateMe);
  router.put('/me/avatar', requireAuth, avatarUpload as RequestHandler, controller.updateAvatar);
  router.delete('/me/avatar', requireAuth, controller.deleteAvatar);
  router.get('/:username', controller.getProfile);
  return router;
}
