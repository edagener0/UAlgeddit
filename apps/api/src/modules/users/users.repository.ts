import { hotRank } from '../../common/utils/votes.js';
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

  /** Case-insensitive lookup on the unique, indexed `username_lower` column. */
  findByUsername(username: string) {
    return this.db.user.findUnique({ where: { usernameLower: username.toLowerCase() } });
  }

  create(data: { username: string; passwordHash: string }) {
    return this.db.user.create({ data: { ...data, usernameLower: data.username.toLowerCase() } });
  }

  updateProfile(id: number, data: { bio?: string | null; birthday?: Date | null }) {
    return this.db.user.update({ where: { id }, data });
  }

  updateAvatar(id: number, avatarUrl: string | null) {
    return this.db.user.update({ where: { id }, data: { avatarUrl } });
  }

  /** Stores a new password hash and revokes every session issued before. */
  updatePassword(id: number, passwordHash: string) {
    return this.db.user.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
  }

  /**
   * Deletes the account and everything it owns (cascades), then repairs the
   * denormalised data of other users that it contributed to: scores and hot ranks
   * of posts/comments it voted on, comment counts of posts it commented on, and
   * the karma of their authors. Returns every image URL that is no longer referenced.
   */
  deleteAccount(id: number): Promise<string[]> {
    return this.db.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id }, select: { avatarUrl: true } });
        if (!user) return [];

        // Everything outside the account that will need recomputing afterwards.
        const votedPosts = await tx.postVote.findMany({
          where: { userId: id },
          select: { postId: true },
        });
        const commentedPosts = await tx.comment.findMany({
          where: { authorId: id },
          select: { postId: true },
          distinct: ['postId'],
        });
        const votedComments = await tx.commentVote.findMany({
          where: { userId: id },
          select: { commentId: true },
        });
        const postIds = [...new Set([...votedPosts, ...commentedPosts].map((row) => row.postId))];
        const commentIds = votedComments.map((row) => row.commentId);

        // Candidate image URLs: anything that can disappear through the cascades.
        const candidates = await tx.$queryRaw<{ url: string }[]>`
          WITH RECURSIVE doomed_comments AS (
            SELECT c.id FROM comments c
              JOIN posts p ON p.id = c.post_id
              JOIN subgeddits s ON s.id = p.subgeddit_id
             WHERE c.author_id = ${id} OR p.author_id = ${id} OR s.owner_id = ${id}
            UNION
            SELECT c.id FROM comments c JOIN doomed_comments d ON c.parent_id = d.id
          )
          SELECT pi.url FROM post_images pi
            JOIN posts p ON p.id = pi.post_id
            JOIN subgeddits s ON s.id = p.subgeddit_id
           WHERE p.author_id = ${id} OR s.owner_id = ${id}
          UNION
          SELECT ci.url FROM comment_images ci JOIN doomed_comments d ON d.id = ci.comment_id
          UNION
          SELECT unnest(ARRAY[icon_url, banner_url]) FROM subgeddits WHERE owner_id = ${id}`;

        await tx.user.delete({ where: { id } });

        // Repair the counters of content that belongs to other users.
        if (commentIds.length > 0) {
          await tx.$executeRaw`
            UPDATE comments c SET score = COALESCE(
              (SELECT SUM(v.value) FROM comment_votes v WHERE v.comment_id = c.id), 0)
             WHERE c.id = ANY(${commentIds})`;
        }
        if (postIds.length > 0) {
          await tx.$executeRaw`
            UPDATE posts p SET
              score = COALESCE((SELECT SUM(v.value) FROM post_votes v WHERE v.post_id = p.id), 0),
              comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL)
             WHERE p.id = ANY(${postIds})`;
          const posts = await tx.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, score: true, createdAt: true },
          });
          for (const post of posts) {
            await tx.post.update({
              where: { id: post.id },
              data: { hotRank: hotRank(post.score, post.createdAt) },
            });
          }
        }
        const authors = await tx.$queryRaw<{ author_id: number }[]>`
          SELECT author_id FROM posts WHERE id = ANY(${postIds})
          UNION SELECT author_id FROM comments WHERE id = ANY(${commentIds})`;
        const authorIds = authors.map((row) => row.author_id);
        if (authorIds.length > 0) {
          await tx.$executeRaw`
            UPDATE users u SET karma =
              COALESCE((SELECT SUM(v.value) FROM post_votes v JOIN posts p ON p.id = v.post_id WHERE p.author_id = u.id), 0)
            + COALESCE((SELECT SUM(v.value) FROM comment_votes v JOIN comments c ON c.id = v.comment_id WHERE c.author_id = u.id), 0)
             WHERE u.id = ANY(${authorIds})`;
        }

        // Only delete files that are really gone (shared URLs are impossible, but be safe).
        const urls = [user.avatarUrl, ...candidates.map((row) => row.url)].filter(
          (url): url is string => Boolean(url),
        );
        const stillUsed = await tx.$queryRaw<{ url: string }[]>`
          SELECT url FROM post_images WHERE url = ANY(${urls})
          UNION SELECT url FROM comment_images WHERE url = ANY(${urls})
          UNION SELECT avatar_url FROM users WHERE avatar_url = ANY(${urls})`;
        const used = new Set(stillUsed.map((row) => row.url));
        return urls.filter((url) => !used.has(url));
      },
      { timeout: 30_000 },
    );
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
