import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { mockOf, mockStorage, PNG_BYTES } from '../../../test/mocks.js';
import type { StorageService } from '../storage/storage.service.js';
import type { SubgedditsRepository } from './subgeddits.repository.js';
import { SubgedditsService } from './subgeddits.service.js';

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'typescript',
  nameLower: 'typescript',
  description: 'All about TS',
  iconUrl: '/uploads/old-icon.png',
  bannerUrl: null,
  ownerId: 10,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  owner: { id: 10, username: 'owner', avatarUrl: null },
  _count: { posts: 3 },
  ...overrides,
});

describe('SubgedditsService', () => {
  let repo: Mocked<SubgedditsRepository>;
  let storage: Mocked<StorageService>;
  let service: SubgedditsService;
  const image = { buffer: PNG_BYTES };

  beforeEach(() => {
    repo = mockOf<SubgedditsRepository>(
      'list',
      'findByName',
      'findById',
      'create',
      'update',
      'delete',
      'collectImageUrls',
    );
    storage = mockStorage();
    service = new SubgedditsService(repo, storage);
  });

  it('maps records to DTOs when listing', async () => {
    repo.list.mockResolvedValue({ items: [record()] as never, total: 1 });
    const page = await service.list({ page: 1, pageSize: 20 });
    expect(page.items[0]).toMatchObject({ name: 'typescript', postCount: 3, owner: { id: 10 } });
    expect(repo.list).toHaveBeenCalledWith({ q: undefined, skip: 0, take: 20 });
  });

  it('throws 404 for unknown subgeddits', async () => {
    repo.findByName.mockResolvedValue(null);
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a subgeddit with icon and banner, preserving their slots', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue(record() as never);

    await service.create(10, { name: 'typescript', description: '' }, { banner: image });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ iconUrl: null, bannerUrl: '/uploads/img-0.png', ownerId: 10 }),
    );
  });

  it('rejects duplicate names', async () => {
    repo.findByName.mockResolvedValue(record() as never);
    await expect(
      service.create(10, { name: 'TypeScript', description: '' }, {}),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(storage.saveImages).not.toHaveBeenCalled();
  });

  it('cleans up stored images if the insert fails', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockRejectedValue(new Error('db down'));
    await expect(
      service.create(10, { name: 'x_x', description: '' }, { icon: image }),
    ).rejects.toThrow('db down');
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/img-0.png', null]);
  });

  it('only lets the owner update', async () => {
    repo.findByName.mockResolvedValue(record() as never);
    await expect(service.update('typescript', 99, {}, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('replaces the icon and deletes the previous file', async () => {
    repo.findByName.mockResolvedValue(record() as never);
    repo.update.mockResolvedValue(record() as never);

    await service.update('typescript', 10, { description: 'new' }, { icon: image });

    expect(repo.update).toHaveBeenCalledWith(1, {
      description: 'new',
      iconUrl: '/uploads/img-0.png',
      bannerUrl: null,
    });
    expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/old-icon.png', null]);
  });

  it('removes the icon on request', async () => {
    repo.findByName.mockResolvedValue(record() as never);
    repo.update.mockResolvedValue(record() as never);
    await service.update('typescript', 10, { removeIcon: true }, {});
    expect(repo.update).toHaveBeenCalledWith(1, { iconUrl: null, bannerUrl: null });
  });

  it('deletes the subgeddit and every image below it', async () => {
    repo.findByName.mockResolvedValue(record() as never);
    repo.collectImageUrls.mockResolvedValue(['/uploads/a.png']);
    await service.delete('typescript', 10);
    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(storage.deleteMany).toHaveBeenCalledWith([
      '/uploads/a.png',
      '/uploads/old-icon.png',
      null,
    ]);
  });
});
