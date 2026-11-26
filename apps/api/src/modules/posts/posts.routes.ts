import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../common/middleware/authenticate.js';
import { commentImagesUpload, postImagesUpload } from '../../common/middleware/upload.js';
import type { CommentsController } from '../comments/comments.controller.js';
import type { PostsController } from './posts.controller.js';

export function createPostsRouter(posts: PostsController, comments: CommentsController): Router {
  const router = Router();
  router.get('/', posts.list);
  router.post('/', requireAuth, postImagesUpload as RequestHandler, posts.create);
  router.get('/:id', posts.get);
  router.patch('/:id', requireAuth, posts.update);
  router.delete('/:id', requireAuth, posts.delete);
  router.put('/:id/vote', requireAuth, posts.vote);
  router.get('/:id/comments', comments.listForPost);
  router.post('/:id/comments', requireAuth, commentImagesUpload as RequestHandler, comments.create);
  return router;
}
