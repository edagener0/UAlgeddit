import { Router } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import type { FriendsController } from './friends.controller.js';

export function createFriendsRouter(controller: FriendsController): Router {
  const router = Router();
  router.use(requireAuth);
  router.get('/', controller.list);
  router.get('/requests', controller.listRequests);
  router.post('/requests', controller.sendRequest);
  router.post('/requests/:userId/accept', controller.accept);
  router.delete('/requests/received/:userId', controller.decline);
  router.delete('/requests/sent/:userId', controller.cancel);
  router.delete('/:userId', controller.unfriend);
  return router;
}
