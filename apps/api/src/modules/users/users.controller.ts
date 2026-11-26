import { updateProfileSchema, usernameParamsSchema } from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { requireUser } from '../../common/http/types.js';
import type { UsersService } from './users.service.js';

export class UsersController {
  constructor(private readonly users: UsersService) {}

  getProfile = async (req: Request, res: Response) => {
    const { username } = usernameParamsSchema.parse(req.params);
    res.json(await this.users.getProfile(username, req.user?.id));
  };

  updateMe = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = updateProfileSchema.parse(req.body);
    await this.users.updateProfile(user.id, input);
    res.json(await this.users.getProfile(user.username, user.id));
  };

  updateAvatar = async (req: Request, res: Response) => {
    const user = requireUser(req);
    res.json(await this.users.updateAvatar(user.id, req.file));
  };

  deleteAvatar = async (req: Request, res: Response) => {
    const user = requireUser(req);
    res.json(await this.users.updateAvatar(user.id, undefined));
  };
}
