import {
  createCommentSchema,
  idParamsSchema,
  listCommentsQuerySchema,
  voteSchema,
} from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { requireUser } from '../../common/http/types.js';
import { arrayFiles } from '../../common/middleware/upload.js';
import type { CommentsService } from './comments.service.js';

export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  listForPost = async (req: Request, res: Response) => {
    const { id } = idParamsSchema.parse(req.params);
    const { sort } = listCommentsQuerySchema.parse(req.query);
    res.json(await this.comments.listForPost(id, sort, req.user?.id));
  };

  create = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    const input = createCommentSchema.parse(req.body ?? {});
    res.status(201).json(await this.comments.create(id, user.id, input, arrayFiles(req.files)));
  };

  delete = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    await this.comments.delete(id, user.id);
    res.status(204).end();
  };

  vote = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { id } = idParamsSchema.parse(req.params);
    const { value } = voteSchema.parse(req.body);
    res.json(await this.comments.vote(id, user.id, value));
  };
}
