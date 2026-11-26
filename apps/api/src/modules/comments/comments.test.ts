import { MAX_COMMENT_DEPTH } from '@ualgeddit/shared';
import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { mockOf, mockStorage, PNG_BYTES } from '../../../test/mocks.js';
import type { StorageService } from '../storage/storage.service.js';
import type { CommentRecord, CommentsRepository } from './comments.repository.js';
import { CommentsService } from './comments.service.js';
import { buildCommentTree } from './comments.tree.js';

let nextId = 1;
const comment = (overrides: Partial<CommentRecord> = {}): CommentRecord =>
  ({
    id: nextId++,
    content: 'text',
    postId: 1,
    authorId: 10,
    parentId: null,
    depth: 0,
    score: 0,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    author: { id: 10, username: 'alice', avatarUrl: null },
    images: [],
    votes: [],
    ...overrides,
  }) as CommentRecord;

describe('buildCommentTree', () => {
  beforeEach(() => {
    nextId = 1;
  });

  it('nests replies under their parents', () => {
    const root = comment();
    const reply = comment({ parentId: root.id });
    const nested = comment({ parentId: reply.id });
    const tree = buildCommentTree([root, reply, nested], 'old');
    expect(tree).toHaveLength(1);
    expect(tree[0]?.replies[0]?.replies[0]?.id).toBe(nested.id);
  });

  it('sorts each level by score for "top"', () => {
    const low = comment({ score: 1 });
    const high = comment({ score: 9 });
    expect(buildCommentTree([low, high], 'top').map((c) => c.id)).toEqual([high.id, low.id]);
  });

  it('sorts by date for "new"', () => {
    const older = comment({ createdAt: new Date('2026-01-01') });
    const newer = comment({ createdAt: new Date('2026-02-01') });
    expect(buildCommentTree([older, newer], 'new').map((c) => c.id)).toEqual([newer.id, older.id]);
  });

  it('hides author and content of deleted comments but keeps their replies', () => {
    const deleted = comment({ deletedAt: new Date(), content: 'secret' });
    const reply = comment({ parentId: deleted.id });
    const [node] = buildCommentTree([deleted, reply], 'top');
    expect(node).toMatchObject({ deleted: true, content: '', author: null });
    expect(node?.replies).toHaveLength(1);
  });

  it('prunes deleted comments without visible replies', () => {
    const deleted = comment({ deletedAt: new Date() });
    const deletedReply = comment({ parentId: deleted.id, deletedAt: new Date() });
    expect(buildCommentTree([deleted, deletedReply], 'top')).toEqual([]);
  });

  it('treats orphans (parent missing) as roots', () => {
    expect(buildCommentTree([comment({ parentId: 999 })], 'top')).toHaveLength(1);
  });
});

describe('CommentsService', () => {
  let repo: Mocked<CommentsRepository>;
  let storage: Mocked<StorageService>;
  let service: CommentsService;

  beforeEach(() => {
    repo = mockOf<CommentsRepository>(
      'listForPost',
      'findById',
      'postExists',
      'create',
      'softDelete',
      'vote',
    );
    storage = mockStorage();
    service = new CommentsService(repo, storage);
    repo.postExists.mockResolvedValue(true);
    repo.create.mockResolvedValue(comment());
  });

  it('requires text or an image', async () => {
    await expect(service.create(1, 10, { content: '' }, [])).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('accepts an image-only comment', async () => {
    await service.create(1, 10, { content: '' }, [{ buffer: PNG_BYTES }]);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrls: ['/uploads/img-0.png'], depth: 0, parentId: null }),
    );
  });

  it('computes the depth of replies', async () => {
    repo.findById.mockResolvedValue({ id: 3, postId: 1, authorId: 2, depth: 2, deletedAt: null });
    await service.create(1, 10, { content: 'hi', parentId: 3 }, []);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ parentId: 3, depth: 3 }));
  });

  it('rejects replies to comments of another post or deleted comments', async () => {
    repo.findById.mockResolvedValue({ id: 3, postId: 2, authorId: 2, depth: 0, deletedAt: null });
    await expect(service.create(1, 10, { content: 'hi', parentId: 3 }, [])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    repo.findById.mockResolvedValue({
      id: 3,
      postId: 1,
      authorId: 2,
      depth: 0,
      deletedAt: new Date(),
    });
    await expect(service.create(1, 10, { content: 'hi', parentId: 3 }, [])).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('limits thread depth', async () => {
    repo.findById.mockResolvedValue({
      id: 3,
      postId: 1,
      authorId: 2,
      depth: MAX_COMMENT_DEPTH,
      deletedAt: null,
    });
    await expect(service.create(1, 10, { content: 'hi', parentId: 3 }, [])).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('404s when the post does not exist', async () => {
    repo.postExists.mockResolvedValue(false);
    await expect(service.listForPost(1, 'top')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('only lets the author delete, and removes the images', async () => {
    repo.findById.mockResolvedValue({ id: 3, postId: 1, authorId: 10, depth: 0, deletedAt: null });
    await expect(service.delete(3, 11)).rejects.toBeInstanceOf(ForbiddenError);

    repo.softDelete.mockResolvedValue(['/uploads/c.png']);
    await service.delete(3, 10);
    expect(repo.softDelete).toHaveBeenCalledWith(3, 1);
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/c.png']);
  });
});
