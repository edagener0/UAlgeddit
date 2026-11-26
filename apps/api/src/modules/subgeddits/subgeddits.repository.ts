import type { Prisma } from '@prisma/client';
import { escapeLike } from '../../common/utils/like.js';
import type { Database } from '../../lib/prisma.js';
import { userSummarySelect } from '../users/users.mapper.js';

export const subgedditInclude = {
  owner: { select: userSummarySelect },
  _count: { select: { posts: true } },
} satisfies Prisma.SubgedditInclude;

export type SubgedditRecord = Prisma.SubgedditGetPayload<{ include: typeof subgedditInclude }>;

export class SubgedditsRepository {
  constructor(private readonly db: Database) {}

  async list(params: { q?: string; skip: number; take: number }) {
    const where: Prisma.SubgedditWhereInput = params.q
      ? {
          OR: [
            { nameLower: { contains: escapeLike(params.q.toLowerCase()) } },
            { description: { contains: escapeLike(params.q), mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.db.subgeddit.findMany({
        where,
        include: subgedditInclude,
        orderBy: [{ posts: { _count: 'desc' } }, { createdAt: 'desc' }],
        skip: params.skip,
        take: params.take,
      }),
      this.db.subgeddit.count({ where }),
    ]);
    return { items, total };
  }

  findByName(name: string) {
    return this.db.subgeddit.findUnique({
      where: { nameLower: name.toLowerCase() },
      include: subgedditInclude,
    });
  }

  findById(id: number) {
    return this.db.subgeddit.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    description: string;
    ownerId: number;
    iconUrl: string | null;
    bannerUrl: string | null;
  }) {
    return this.db.subgeddit.create({
      data: { ...data, nameLower: data.name.toLowerCase() },
      include: subgedditInclude,
    });
  }

  update(
    id: number,
    data: { description?: string; iconUrl?: string | null; bannerUrl?: string | null },
  ) {
    return this.db.subgeddit.update({ where: { id }, data, include: subgedditInclude });
  }

  delete(id: number) {
    return this.db.subgeddit.delete({ where: { id } });
  }

  /** Every stored image that disappears (through cascades) when the subgeddit is deleted. */
  async collectImageUrls(id: number): Promise<string[]> {
    const [postImages, commentImages] = await Promise.all([
      this.db.postImage.findMany({ where: { post: { subgedditId: id } }, select: { url: true } }),
      this.db.commentImage.findMany({
        where: { comment: { post: { subgedditId: id } } },
        select: { url: true },
      }),
    ]);
    return [...postImages, ...commentImages].map((image) => image.url);
  }
}
