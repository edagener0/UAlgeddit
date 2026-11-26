import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { mockOf } from '../../../test/mocks.js';
import type { UsersRepository } from '../users/users.repository.js';
import { canonicalPair, type FriendsRepository } from './friends.repository.js';
import { FriendsService } from './friends.service.js';

describe('canonicalPair', () => {
  it('always puts the smaller id first', () => {
    expect(canonicalPair(9, 2)).toEqual({ userAId: 2, userBId: 9 });
    expect(canonicalPair(2, 9)).toEqual({ userAId: 2, userBId: 9 });
  });
});

describe('FriendsService', () => {
  let friends: Mocked<FriendsRepository>;
  let users: Mocked<UsersRepository>;
  let service: FriendsService;

  beforeEach(() => {
    friends = mockOf<FriendsRepository>(
      'getStatus',
      'createRequest',
      'createFriendship',
      'findRequest',
      'deleteRequest',
      'deleteFriendship',
    );
    users = mockOf<UsersRepository>('findByUsername');
    service = new FriendsService(friends, users);
    users.findByUsername.mockResolvedValue({ id: 2, username: 'bob' } as never);
  });

  it('sends a request', async () => {
    friends.getStatus.mockResolvedValue('none');
    await expect(service.sendRequest(1, 'bob')).resolves.toEqual({ status: 'request_sent' });
    expect(friends.createRequest).toHaveBeenCalledWith(1, 2);
  });

  it('auto-accepts when the other user already sent a request', async () => {
    friends.getStatus.mockResolvedValue('request_received');
    await expect(service.sendRequest(1, 'bob')).resolves.toEqual({ status: 'friends' });
    expect(friends.createFriendship).toHaveBeenCalledWith(1, 2);
    expect(friends.createRequest).not.toHaveBeenCalled();
  });

  it.each(['friends', 'request_sent'] as const)('rejects duplicates (%s)', async (status) => {
    friends.getStatus.mockResolvedValue(status);
    await expect(service.sendRequest(1, 'bob')).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects befriending yourself', async () => {
    await expect(service.sendRequest(2, 'bob')).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects unknown users', async () => {
    users.findByUsername.mockResolvedValue(null);
    await expect(service.sendRequest(1, 'ghost')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('accepts only existing requests', async () => {
    friends.findRequest.mockResolvedValue(null);
    await expect(service.accept(1, 2)).rejects.toBeInstanceOf(NotFoundError);

    friends.findRequest.mockResolvedValue({ fromId: 2, toId: 1 } as never);
    await service.accept(1, 2);
    expect(friends.findRequest).toHaveBeenLastCalledWith(2, 1);
    expect(friends.createFriendship).toHaveBeenCalledWith(1, 2);
  });

  it('decline / cancel / unfriend report missing rows as 404', async () => {
    friends.deleteRequest.mockResolvedValue(0);
    friends.deleteFriendship.mockResolvedValue(0);
    await expect(service.decline(1, 2)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.cancel(1, 2)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.unfriend(1, 2)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('decline deletes the request in the right direction', async () => {
    friends.deleteRequest.mockResolvedValue(1);
    await service.decline(1, 2);
    expect(friends.deleteRequest).toHaveBeenCalledWith(2, 1);
  });
});
