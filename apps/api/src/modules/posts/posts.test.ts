import { MAX_POST_IMAGES } from '@ualgeddit/shared';
import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { mockOf, mockStorage, PNG_BYTES } from '../../../test/mocks.js';
import type { StorageService } from '../storage/storage.service.js';
import type { SubgedditsRepository } from '../subgeddits/subgeddits.repository.js';
import { toMyVote, toPostDto } from './posts.mapper.js';
import type { PostRecord, PostsRepository } from './posts.repository.js';
import { PostsService } from './posts.service.js';

const postRecord = (overrides: Partial<PostRecord> = {}): PostRecord =>
  ({
    id: 5,
    title: 'Hello',
    content: 'World',
    subgedditId: 1,
    authorId: 10,
    score: 4,
    hotRank: 0,
    commentCount: 2,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    author: { id: 10, username: 'alice', avatarUrl: null },
    subgeddit: { id: 1, name: 'typescript', iconUrl: null },
    images: [{ id: 1, url: '/uploads/a.png', position: 0 }],
    votes: [{ value: -1 }],
    ...overrides,
  }) as PostRecord;

describe('posts mapper', () => {
  it('derives myVote from the viewer vote', () => {
    expect(toMyVote([])).toBe(0);
    expect(toMyVote([{ value: 1 }])).toBe(1);
    expect(toPostDto(postRecord()).myVote).toBe(-1);
  });

  it('serialises dates as ISO strings', () => {
    expect(toPostDto(postRecord()).createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('PostsService', () => {
  let posts: Mocked<PostsRepository>;
  let subgeddits: Mocked<SubgedditsRepository>;
  let storage: Mocked<StorageService>;
  let service: PostsService;
  const image = { buffer: PNG_BYTES };

  beforeEach(() => {
    posts = mockOf<PostsRepository>(
      'list',
      'findById',
      'findMeta',
      'create',
      'update',
      'delete',
      'vote',
      'commentImageUrls',
    );
    subgeddits = mockOf<SubgedditsRepository>('findById');
    storage = mockStorage();
    service = new PostsService(posts, subgeddits, storage);
  });

  it('passes filters, sort and pagination to the repository', async () => {
    posts.list.mockResolvedValue({ items: [postRecord()], total: 1 });
    const page = await service.list(
      { page: 2, pageSize: 10, sort: 'top', subgeddit: 'typescript' },
      10,
    );
    expect(posts.list).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'top',
        subgeddit: 'typescript',
        skip: 10,
        take: 10,
        viewerId: 10,
      }),
    );
    expect(page.total).toBe(1);
  });

  it('creates a post with its images in order', async () => {
    subgeddits.findById.mockResolvedValue({ id: 1 } as never);
    posts.create.mockResolvedValue(postRecord());

    await service.create(10, { subgedditId: 1, title: 'Hi', content: '' }, [image, image]);

    expect(posts.create).toHaveBeenCalledWith({
      subgedditId: 1,
      title: 'Hi',
      content: '',
      authorId: 10,
      imageUrls: ['/uploads/img-0.png', '/uploads/img-1.png'],
    });
  });

  it('rejects posts in unknown subgeddits before storing images', async () => {
    subgeddits.findById.mockResolvedValue(null);
    await expect(
      service.create(10, { subgedditId: 99, title: 'Hi', content: '' }, [image]),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.saveImages).not.toHaveBeenCalled();
  });

  it('rejects too many images', async () => {
    const images = Array.from({ length: MAX_POST_IMAGES + 1 }, () => image);
    await expect(
      service.create(10, { subgedditId: 1, title: 'Hi', content: '' }, images),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('removes stored images when the insert fails', async () => {
    subgeddits.findById.mockResolvedValue({ id: 1 } as never);
    posts.create.mockRejectedValue(new Error('db down'));
    await expect(
      service.create(10, { subgedditId: 1, title: 'Hi', content: '' }, [image]),
    ).rejects.toThrow();
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/img-0.png']);
  });

  it('only lets the author edit or delete', async () => {
    posts.findMeta.mockResolvedValue({ id: 5, authorId: 10, images: [] });
    await expect(service.update(5, 11, { title: 'x' })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.delete(5, 11)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('deletes post and comment images from storage', async () => {
    posts.findMeta.mockResolvedValue({ id: 5, authorId: 10, images: [{ url: '/uploads/p.png' }] });
    posts.commentImageUrls.mockResolvedValue(['/uploads/c.png']);
    await service.delete(5, 10);
    expect(posts.delete).toHaveBeenCalledWith(5);
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/p.png', '/uploads/c.png']);
  });

  it('404s on missing posts', async () => {
    posts.findById.mockResolvedValue(null);
    posts.findMeta.mockResolvedValue(null);
    await expect(service.get(1)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(1, 1)).rejects.toBeInstanceOf(NotFoundError);
  });
});
