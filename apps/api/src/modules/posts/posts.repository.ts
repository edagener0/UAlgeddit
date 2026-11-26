import type { Prisma } from '@prisma/client';
import type { PostSort, VoteValue } from '@ualgeddit/shared';
import { NotFoundError } from '../../common/errors/app-error.js';
import { hotRank, voteDelta } from '../../common/utils/votes.js';
import type { Database } from '../../lib/prisma.js';
import { userSummarySelect } from '../users/users.mapper.js';

/** Relations loaded for every post; `votes` is narrowed to the viewer's own vote. */
export function postInclude(viewerId?: number) {
  return {
    author: { select: userSummarySelect },
    subgeddit: { select: { id: true, name: true, iconUrl: true } },
    images: { select: { id: true, url: true, position: true }, orderBy: { position: 'asc' } },
    votes: { where: { userId: viewerId ?? -1 }, select: { value: true } },
  } satisfies Prisma.PostInclude;
}

export type PostRecord = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

const ORDER_BY: Record<PostSort, Prisma.PostOrderByWithRelationInput[]> = {
  hot: [{ hotRank: 'desc' }, { id: 'desc' }],
  new: [{ createdAt: 'desc' }, { id: 'desc' }],
  top: [{ score: 'desc' }, { createdAt: 'desc' }],
};

export interface ListPostsParams {
  sort: PostSort;
  subgeddit?: string;
  author?: string;
  q?: string;
  skip: number;
  take: number;
  viewerId?: number;
}

export class PostsRepository {
  constructor(private readonly db: Database) {}

  async list(params: ListPostsParams) {
    const where: Prisma.PostWhereInput = {
      ...(params.subgeddit && { subgeddit: { nameLower: params.subgeddit.toLowerCase() } }),
      ...(params.author && {
        author: { usernameLower: params.author.toLowerCase() },
      }),
      ...(params.q && {
        OR: [
          { title: { contains: params.q, mode: 'insensitive' } },
          { content: { contains: params.q, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.db.post.findMany({
        where,
        include: postInclude(params.viewerId),
        orderBy: ORDER_BY[params.sort],
        skip: params.skip,
        take: params.take,
      }),
      this.db.post.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number, viewerId?: number) {
    return this.db.post.findUnique({ where: { id }, include: postInclude(viewerId) });
  }

  findMeta(id: number) {
    return this.db.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, images: { select: { url: true } } },
    });
  }

  create(data: {
    title: string;
    content: string;
    subgedditId: number;
    authorId: number;
    imageUrls: string[];
  }) {
    const createdAt = new Date();
    return this.db.post.create({
      data: {
        title: data.title,
        content: data.content,
        subgedditId: data.subgedditId,
        authorId: data.authorId,
        createdAt,
        hotRank: hotRank(0, createdAt),
        images: { create: data.imageUrls.map((url, position) => ({ url, position })) },
      },
      include: postInclude(data.authorId),
    });
  }

  update(id: number, data: { title?: string; content?: string }, viewerId: number) {
    return this.db.post.update({
      where: { id },
      data: { ...data, editedAt: new Date() },
      include: postInclude(viewerId),
    });
  }

  delete(id: number) {
    return this.db.post.delete({ where: { id } });
  }

  async commentImageUrls(postId: number): Promise<string[]> {
    const rows = await this.db.commentImage.findMany({
      where: { comment: { postId } },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }

  /**
   * Applies a vote atomically: updates the vote row, the post score, its hot
   * rank and the author's karma in a single transaction.
   */
  vote(postId: number, userId: number, value: VoteValue) {
    return this.db.$transaction(async (tx) => {
      // Row lock: concurrent votes on the same post run one after the other, so the
      // "previous vote" read below can never be stale (no double counting).
      await tx.$queryRaw`SELECT id FROM posts WHERE id = ${postId} FOR UPDATE`;
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, score: true, createdAt: true, authorId: true },
      });
      if (!post) throw new NotFoundError('Post');

      const existing = await tx.postVote.findUnique({
        where: { userId_postId: { userId, postId } },
      });
      const delta = voteDelta((existing?.value ?? 0) as VoteValue, value);
      if (delta === 0) return { score: post.score, myVote: value };

      if (value === 0) {
        await tx.postVote.delete({ where: { userId_postId: { userId, postId } } });
      } else {
        await tx.postVote.upsert({
          where: { userId_postId: { userId, postId } },
          create: { userId, postId, value },
          update: { value },
        });
      }

      const score = post.score + delta;
      await tx.post.update({
        where: { id: postId },
        data: { score, hotRank: hotRank(score, post.createdAt) },
      });
      await tx.user.update({ where: { id: post.authorId }, data: { karma: { increment: delta } } });
      return { score, myVote: value };
    });
  }
}
