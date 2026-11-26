import type { Database } from '../../lib/prisma.js';

export class UsersRepository {
  constructor(private readonly db: Database) {}

  findById(id: number) {
    return this.db.user.findUnique({ where: { id } });
  }

  /** Minimal projection used on every authenticated request. */
  findAuthById(id: number) {
    return this.db.user.findUnique({
      where: { id },
      select: { id: true, username: true, tokenVersion: true },
    });
  }

  /** Case-insensitive lookup, so "Alice" and "alice" are the same account. */
  findByUsername(username: string) {
    return this.db.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
  }

  create(data: { username: string; passwordHash: string }) {
    return this.db.user.create({ data });
  }

  updateProfile(id: number, data: { bio?: string | null; birthday?: Date | null }) {
    return this.db.user.update({ where: { id }, data });
  }

  updateAvatar(id: number, avatarUrl: string | null) {
    return this.db.user.update({ where: { id }, data: { avatarUrl } });
  }

  incrementTokenVersion(id: number) {
    return this.db.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
  }

  async countStats(id: number) {
    const [postCount, friendCount] = await Promise.all([
      this.db.post.count({ where: { authorId: id } }),
      this.db.friendship.count({ where: { OR: [{ userAId: id }, { userBId: id }] } }),
    ]);
    return { postCount, friendCount };
  }
}
