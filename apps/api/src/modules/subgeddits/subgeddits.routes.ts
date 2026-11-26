import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import { subgedditImagesUpload } from '../../common/middleware/upload.js';
import type { SubgedditsController } from './subgeddits.controller.js';

export function createSubgedditsRouter(controller: SubgedditsController): Router {
  const upload = subgedditImagesUpload as RequestHandler;
  const router = Router();
  router.get('/', controller.list);
  router.post('/', requireAuth, upload, controller.create);
  router.get('/:name', controller.get);
  router.patch('/:name', requireAuth, upload, controller.update);
  router.delete('/:name', requireAuth, controller.delete);
  return router;
}
