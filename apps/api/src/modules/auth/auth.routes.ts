import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(
  controller: AuthController,
  limits: { perIp: RequestHandler; perAccount: RequestHandler },
): Router {
  const router = Router();
  router.post('/register', limits.perIp, controller.register);
  router.post('/login', limits.perIp, limits.perAccount, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth, controller.me);
  return router;
}
