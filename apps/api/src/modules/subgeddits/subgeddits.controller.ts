import {
  createSubgedditSchema,
  listSubgedditsQuerySchema,
  subgedditNameParamsSchema,
  updateSubgedditSchema,
} from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { requireUser } from '../../common/http/types.js';
import { fieldFile } from '../../common/middleware/upload.js';
import type { SubgedditsService } from './subgeddits.service.js';

const imagesFrom = (req: Request) => ({
  icon: fieldFile(req.files, 'icon'),
  banner: fieldFile(req.files, 'banner'),
});

export class SubgedditsController {
  constructor(private readonly subgeddits: SubgedditsService) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.subgeddits.list(listSubgedditsQuerySchema.parse(req.query)));
  };

  get = async (req: Request, res: Response) => {
    const { name } = subgedditNameParamsSchema.parse(req.params);
    res.json(await this.subgeddits.get(name));
  };

  create = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = createSubgedditSchema.parse(req.body);
    res.status(201).json(await this.subgeddits.create(user.id, input, imagesFrom(req)));
  };

  update = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { name } = subgedditNameParamsSchema.parse(req.params);
    const input = updateSubgedditSchema.parse(req.body ?? {});
    res.json(await this.subgeddits.update(name, user.id, input, imagesFrom(req)));
  };

  delete = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { name } = subgedditNameParamsSchema.parse(req.params);
    await this.subgeddits.delete(name, user.id);
    res.status(204).end();
  };
}
