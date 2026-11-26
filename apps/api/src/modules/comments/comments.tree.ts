import type { CommentDto, CommentSort } from '@ualgeddit/shared';
import { toMyVote } from '../posts/posts.mapper.js';
import { toUserSummary } from '../users/users.mapper.js';
import type { CommentRecord } from './comments.repository.js';

export function toCommentDto(record: CommentRecord): CommentDto {
  const deleted = record.deletedAt !== null;
  return {
    id: record.id,
    postId: record.postId,
    parentId: record.parentId,
    content: deleted ? '' : record.content,
    deleted,
    createdAt: record.createdAt.toISOString(),
    score: record.score,
    myVote: toMyVote(record.votes),
    author: deleted ? null : toUserSummary(record.author),
    images: deleted ? [] : record.images,
    replies: [],
  };
}

const COMPARATORS: Record<CommentSort, (a: CommentDto, b: CommentDto) => number> = {
  top: (a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt),
  new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  old: (a, b) => a.createdAt.localeCompare(b.createdAt),
};

/**
 * Builds the nested reply tree from a flat list of comments, sorts every level
 * and prunes deleted comments that have no remaining replies.
 */
export function buildCommentTree(records: CommentRecord[], sort: CommentSort): CommentDto[] {
  const nodes = new Map<number, CommentDto>();
  for (const record of records) nodes.set(record.id, toCommentDto(record));

  const roots: CommentDto[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
    (parent ? parent.replies : roots).push(node);
  }

  const finalize = (level: CommentDto[]): CommentDto[] =>
    level
      .map((node) => ({ ...node, replies: finalize(node.replies) }))
      .filter((node) => !node.deleted || node.replies.length > 0)
      .sort(COMPARATORS[sort]);

  return finalize(roots);
}
