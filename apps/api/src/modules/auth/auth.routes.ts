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
  // Sensitive actions require the current password and share the strict per-IP limit.
  router.put('/password', requireAuth, limits.perIp, controller.changePassword);
  router.delete('/account', requireAuth, limits.perIp, controller.deleteAccount);
  return router;
}
