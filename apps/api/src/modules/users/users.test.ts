import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import { NotFoundError } from '../../common/errors/app-error.js';
import { mockOf, mockStorage, PNG_BYTES } from '../../../test/mocks.js';
import type { FriendsRepository } from '../friends/friends.repository.js';
import type { StorageService } from '../storage/storage.service.js';
import type { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

const user = {
  id: 1,
  username: 'alice',
  avatarUrl: '/uploads/old.png',
  bio: 'hi',
  birthday: new Date('2000-05-17T00:00:00Z'),
  karma: 12,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('UsersService', () => {
  let users: Mocked<UsersRepository>;
  let friends: Mocked<FriendsRepository>;
  let storage: Mocked<StorageService>;
  let service: UsersService;

  beforeEach(() => {
    users = mockOf<UsersRepository>(
      'findByUsername',
      'findById',
      'countStats',
      'updateProfile',
      'updateAvatar',
    );
    friends = mockOf<FriendsRepository>('getStatus');
    storage = mockStorage();
    service = new UsersService(users, friends, storage);
  });

  it('builds the profile with stats and the viewer friendship status', async () => {
    users.findByUsername.mockResolvedValue(user as never);
    users.countStats.mockResolvedValue({ postCount: 3, friendCount: 2 });
    friends.getStatus.mockResolvedValue('friends');

    const profile = await service.getProfile('alice', 2);

    expect(profile).toMatchObject({
      birthday: '2000-05-17',
      karma: 12,
      postCount: 3,
      friendshipStatus: 'friends',
    });
    expect(friends.getStatus).toHaveBeenCalledWith(2, 1);
  });

  it('reports "none" for anonymous viewers', async () => {
    users.findByUsername.mockResolvedValue(user as never);
    users.countStats.mockResolvedValue({ postCount: 0, friendCount: 0 });
    expect((await service.getProfile('alice')).friendshipStatus).toBe('none');
    expect(friends.getStatus).not.toHaveBeenCalled();
  });

  it('404s for unknown users', async () => {
    users.findByUsername.mockResolvedValue(null);
    await expect(service.getProfile('ghost')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('only updates provided fields and normalises empty values', async () => {
    await service.updateProfile(1, { bio: '', birthday: '1999-01-02' });
    expect(users.updateProfile).toHaveBeenCalledWith(1, {
      bio: null,
      birthday: new Date('1999-01-02'),
    });

    await service.updateProfile(1, {});
    expect(users.updateProfile).toHaveBeenLastCalledWith(1, {});
  });

  it('replaces the avatar and deletes the old file', async () => {
    users.findById.mockResolvedValue(user as never);
    users.updateAvatar.mockResolvedValue({ ...user, avatarUrl: '/uploads/img-0.png' } as never);

    const result = await service.updateAvatar(1, { buffer: PNG_BYTES });

    expect(result.avatarUrl).toBe('/uploads/img-0.png');
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/old.png']);
  });
});
