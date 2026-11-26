import type { AuthUser, UpdateProfileInput, UserProfile } from '@ualgeddit/shared';
import { NotFoundError } from '../../common/errors/app-error.js';
import type { FriendsRepository } from '../friends/friends.repository.js';
import type { ImageFile, StorageService } from '../storage/storage.service.js';
import { toIsoDate } from './users.mapper.js';
import type { UsersRepository } from './users.repository.js';

export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly friends: FriendsRepository,
    private readonly storage: StorageService,
  ) {}

  async getProfile(username: string, viewerId?: number): Promise<UserProfile> {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundError('User');

    const [stats, friendshipStatus] = await Promise.all([
      this.users.countStats(user.id),
      viewerId === undefined
        ? Promise.resolve('none' as const)
        : this.friends.getStatus(viewerId, user.id),
    ]);

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      birthday: toIsoDate(user.birthday),
      karma: user.karma,
      createdAt: user.createdAt.toISOString(),
      friendCount: stats.friendCount,
      postCount: stats.postCount,
      friendshipStatus,
    };
  }

  async updateProfile(userId: number, input: UpdateProfileInput): Promise<void> {
    await this.users.updateProfile(userId, {
      ...(input.bio !== undefined && { bio: input.bio || null }),
      ...(input.birthday !== undefined && {
        birthday: input.birthday ? new Date(input.birthday) : null,
      }),
    });
  }

  /** Replaces (or removes, when `file` is undefined) the user's avatar. */
  async updateAvatar(userId: number, file: ImageFile | undefined): Promise<AuthUser> {
    const current = await this.users.findById(userId);
    if (!current) throw new NotFoundError('User');

    const [url = null] = file ? await this.storage.saveImages([file], 'avatar') : [];
    let updated;
    try {
      updated = await this.users.updateAvatar(userId, url);
    } catch (error) {
      await this.storage.deleteMany([url]);
      throw error;
    }
    await this.storage.deleteMany([current.avatarUrl]);
    return { id: updated.id, username: updated.username, avatarUrl: updated.avatarUrl };
  }
}
