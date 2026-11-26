import type { FriendshipStatus } from '@ualgeddit/shared';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { FriendsRepository } from './friends.repository.js';

export class FriendsService {
  constructor(
    private readonly friends: FriendsRepository,
    private readonly users: UsersRepository,
  ) {}

  /**
   * Sends a friend request. If the target had already sent one to us, the
   * friendship is created straight away.
   */
  async sendRequest(fromId: number, username: string): Promise<{ status: FriendshipStatus }> {
    const target = await this.users.findByUsername(username);
    if (!target) throw new NotFoundError('User');
    if (target.id === fromId) throw new BadRequestError('You cannot befriend yourself');

    const status = await this.friends.getStatus(fromId, target.id);
    if (status === 'friends') throw new ConflictError('You are already friends');
    if (status === 'request_sent') throw new ConflictError('Friend request already sent');

    if (status === 'request_received') {
      await this.friends.createFriendship(fromId, target.id);
      return { status: 'friends' };
    }

    await this.friends.createRequest(fromId, target.id);
    return { status: 'request_sent' };
  }

  async accept(userId: number, fromUserId: number): Promise<void> {
    if (!(await this.friends.findRequest(fromUserId, userId))) {
      throw new NotFoundError('Friend request');
    }
    await this.friends.createFriendship(userId, fromUserId);
  }

  async decline(userId: number, fromUserId: number): Promise<void> {
    if ((await this.friends.deleteRequest(fromUserId, userId)) === 0) {
      throw new NotFoundError('Friend request');
    }
  }

  async cancel(userId: number, toUserId: number): Promise<void> {
    if ((await this.friends.deleteRequest(userId, toUserId)) === 0) {
      throw new NotFoundError('Friend request');
    }
  }

  async unfriend(userId: number, otherId: number): Promise<void> {
    if ((await this.friends.deleteFriendship(userId, otherId)) === 0) {
      throw new NotFoundError('Friendship');
    }
  }

  listFriends(userId: number) {
    return this.friends.listFriends(userId);
  }

  async listRequests(userId: number) {
    const [received, sent] = await Promise.all([
      this.friends.listReceived(userId),
      this.friends.listSent(userId),
    ]);
    return { received, sent };
  }
}
