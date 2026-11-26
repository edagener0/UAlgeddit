import {
  createPostSchema,
  idParamsSchema,
  listPostsQuerySchema,
  updatePostSchema,
  voteSchema,
} from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { requireUser } from '../../common/http/types.js';
import { arrayFiles } from '../../common/middleware/upload.js';
import type { PostsService } from './posts.service.js';

export class PostsController {
  constructor(private readonly posts: PostsService) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.posts.list(listPostsQuerySchema.parse(req.query), req.user?.id));
  };

  get = async (req: Request, res: Response) => {
    const { id } = idParamsSchema.parse(req.params);
    res.json(await this.posts.get(id, req.user?.id));
  };

  create = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = createPostSchema.parse(req.body);
    res.status(201).json(await this.posts.create(user.id, input, arrayFiles(req.files)));
  };

  update = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    res.json(await this.posts.update(id, user.id, updatePostSchema.parse(req.body)));
  };

  delete = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    await this.posts.delete(id, user.id);
    res.status(204).end();
  };

  vote = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    const { value } = voteSchema.parse(req.body);
    res.json(await this.posts.vote(id, user.id, value));
  };
}
