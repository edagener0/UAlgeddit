import type { FriendDto, FriendRequestDto, FriendshipStatus } from '@ualgeddit/shared';
import type { Database } from '../../lib/prisma.js';
import { toUserSummary, userSummarySelect } from '../users/users.mapper.js';

/** Friendships are undirected and stored once with the smaller id first. */
export function canonicalPair(a: number, b: number) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export class FriendsRepository {
  constructor(private readonly db: Database) {}

  async getStatus(viewerId: number, otherId: number): Promise<FriendshipStatus> {
    if (viewerId === otherId) return 'self';
    const [friendship, sent, received] = await Promise.all([
      this.findFriendship(viewerId, otherId),
      this.findRequest(viewerId, otherId),
      this.findRequest(otherId, viewerId),
    ]);
    if (friendship) return 'friends';
    if (sent) return 'request_sent';
    if (received) return 'request_received';
    return 'none';
  }

  findFriendship(a: number, b: number) {
    return this.db.friendship.findUnique({ where: { userAId_userBId: canonicalPair(a, b) } });
  }

  findRequest(fromId: number, toId: number) {
    return this.db.friendRequest.findUnique({ where: { fromId_toId: { fromId, toId } } });
  }

  createRequest(fromId: number, toId: number) {
    return this.db.friendRequest.create({ data: { fromId, toId } });
  }

  async deleteRequest(fromId: number, toId: number): Promise<number> {
    const { count } = await this.db.friendRequest.deleteMany({ where: { fromId, toId } });
    return count;
  }

  /** Removes pending requests in both directions and creates the friendship atomically. */
  async createFriendship(a: number, b: number): Promise<void> {
    await this.db.$transaction([
      this.db.friendRequest.deleteMany({
        where: {
          OR: [
            { fromId: a, toId: b },
            { fromId: b, toId: a },
          ],
        },
      }),
      this.db.friendship.create({ data: canonicalPair(a, b) }),
    ]);
  }

  async deleteFriendship(a: number, b: number): Promise<number> {
    const { count } = await this.db.friendship.deleteMany({ where: canonicalPair(a, b) });
    return count;
  }

  async listFriends(userId: number): Promise<FriendDto[]> {
    const rows = await this.db.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: { userA: { select: userSummarySelect }, userB: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      ...toUserSummary(row.userAId === userId ? row.userB : row.userA),
      since: row.createdAt.toISOString(),
    }));
  }

  async listReceived(userId: number): Promise<FriendRequestDto[]> {
    const rows = await this.db.friendRequest.findMany({
      where: { toId: userId },
      include: { from: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      from: toUserSummary(row.from),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listSent(userId: number) {
    const rows = await this.db.friendRequest.findMany({
      where: { fromId: userId },
      include: { to: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      to: toUserSummary(row.to),
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
