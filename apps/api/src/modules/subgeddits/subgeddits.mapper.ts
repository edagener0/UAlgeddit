import type { SubgedditDto } from '@ualgeddit/shared';
import { toUserSummary } from '../users/users.mapper.js';
import type { SubgedditRecord } from './subgeddits.repository.js';

export function toSubgedditDto(record: SubgedditRecord): SubgedditDto {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    iconUrl: record.iconUrl,
    bannerUrl: record.bannerUrl,
    createdAt: record.createdAt.toISOString(),
    owner: toUserSummary(record.owner),
    postCount: record._count.posts,
  };
}
