import { idSchema, sendFriendRequestSchema } from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireUser } from '../../common/http/types.js';
import type { FriendsService } from './friends.service.js';

const userIdParams = z.object({ userId: idSchema });

export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.friends.listFriends(requireUser(req).id));
  };

  listRequests = async (req: Request, res: Response) => {
    res.json(await this.friends.listRequests(requireUser(req).id));
  };

  sendRequest = async (req: Request, res: Response) => {
    const { username } = sendFriendRequestSchema.parse(req.body);
    res.status(201).json(await this.friends.sendRequest(requireUser(req).id, username));
  };

  accept = async (req: Request, res: Response) => {
    const { userId } = userIdParams.parse(req.params);
    await this.friends.accept(requireUser(req).id, userId);
    res.status(204).end();
  };

  decline = async (req: Request, res: Response) => {
    const { userId } = userIdParams.parse(req.params);
    await this.friends.decline(requireUser(req).id, userId);
    res.status(204).end();
  };

  cancel = async (req: Request, res: Response) => {
    const { userId } = userIdParams.parse(req.params);
    await this.friends.cancel(requireUser(req).id, userId);
    res.status(204).end();
  };

  unfriend = async (req: Request, res: Response) => {
    const { userId } = userIdParams.parse(req.params);
    await this.friends.unfriend(requireUser(req).id, userId);
    res.status(204).end();
  };
}
