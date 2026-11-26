import type { Database } from '../../lib/prisma.js';
import { userSummarySelect } from '../users/users.mapper.js';

const include = { author: { select: userSummarySelect } } as const;

export class ChatRepository {
  constructor(private readonly db: Database) {}

  create(authorId: number, content: string) {
    return this.db.chatMessage.create({ data: { authorId, content }, include });
  }

  /** Latest `limit` messages, returned oldest first. */
  async listRecent(limit: number) {
    const rows = await this.db.chatMessage.findMany({
      include,
      orderBy: { id: 'desc' },
      take: limit,
    });
    return rows.reverse();
  }
}
