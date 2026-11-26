import type { Prisma } from '@prisma/client';
import type { VoteValue } from '@ualgeddit/shared';
import { NotFoundError } from '../../common/errors/app-error.js';
import { voteDelta } from '../../common/utils/votes.js';
import type { Database } from '../../lib/prisma.js';
import { userSummarySelect } from '../users/users.mapper.js';

export function commentInclude(viewerId?: number) {
  return {
    author: { select: userSummarySelect },
    images: { select: { id: true, url: true, position: true }, orderBy: { position: 'asc' } },
    votes: { where: { userId: viewerId ?? -1 }, select: { value: true } },
  } satisfies Prisma.CommentInclude;
}

export type CommentRecord = Prisma.CommentGetPayload<{
  include: ReturnType<typeof commentInclude>;
}>;

export class CommentsRepository {
  constructor(private readonly db: Database) {}

  listForPost(postId: number, viewerId?: number) {
    return this.db.comment.findMany({
      where: { postId },
      include: commentInclude(viewerId),
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: number) {
    return this.db.comment.findUnique({
      where: { id },
      select: { id: true, postId: true, authorId: true, depth: true, deletedAt: true },
    });
  }

  postExists(postId: number) {
    return this.db.post.count({ where: { id: postId } }).then((count) => count > 0);
  }

  create(data: {
    postId: number;
    authorId: number;
    parentId: number | null;
    depth: number;
    content: string;
    imageUrls: string[];
  }) {
    return this.db.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId: data.postId,
          authorId: data.authorId,
          parentId: data.parentId,
          depth: data.depth,
          content: data.content,
          images: { create: data.imageUrls.map((url, position) => ({ url, position })) },
        },
        include: commentInclude(data.authorId),
      });
      await tx.post.update({
        where: { id: data.postId },
        data: { commentCount: { increment: 1 } },
      });
      return comment;
    });
  }

  /**
   * Soft-deletes a comment (keeps the row so replies stay attached) and returns
   * the URLs of the images that were detached from it.
   */
  softDelete(id: number, postId: number) {
    return this.db.$transaction(async (tx) => {
      const images = await tx.commentImage.findMany({ where: { commentId: id } });
      await tx.commentImage.deleteMany({ where: { commentId: id } });
      await tx.comment.update({ where: { id }, data: { content: '', deletedAt: new Date() } });
      await tx.post.update({ where: { id: postId }, data: { commentCount: { decrement: 1 } } });
      return images.map((image) => image.url);
    });
  }

  vote(commentId: number, userId: number, value: VoteValue) {
    return this.db.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { score: true, authorId: true, deletedAt: true },
      });
      if (!comment || comment.deletedAt) throw new NotFoundError('Comment');

      const key = { userId_commentId: { userId, commentId } };
      const existing = await tx.commentVote.findUnique({ where: key });
      const delta = voteDelta((existing?.value ?? 0) as VoteValue, value);
      if (delta === 0) return { score: comment.score, myVote: value };

      if (value === 0) {
        await tx.commentVote.delete({ where: key });
      } else {
        await tx.commentVote.upsert({
          where: key,
          create: { userId, commentId, value },
          update: { value },
        });
      }
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { score: { increment: delta } },
        select: { score: true },
      });
      await tx.user.update({
        where: { id: comment.authorId },
        data: { karma: { increment: delta } },
      });
      return { score: updated.score, myVote: value };
    });
  }
}
