import type { PostDto } from '@ualgeddit/shared';
import { toUserSummary } from '../users/users.mapper.js';
import type { PostRecord } from './posts.repository.js';

export function toMyVote(votes: { value: number }[]): -1 | 0 | 1 {
  const value = votes[0]?.value ?? 0;
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

export function toPostDto(record: PostRecord): PostDto {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    editedAt: record.editedAt?.toISOString() ?? null,
    score: record.score,
    commentCount: record.commentCount,
    myVote: toMyVote(record.votes),
    images: record.images,
    author: toUserSummary(record.author),
    subgeddit: record.subgeddit,
  };
}
