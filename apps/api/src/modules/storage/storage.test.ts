import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnsupportedMediaTypeError } from '../../common/errors/app-error.js';
import { PNG_BYTES } from '../../../test/mocks.js';
import { LocalDiskStorage } from './storage.service.js';

describe('LocalDiskStorage', () => {
  let dir: string;
  let storage: LocalDiskStorage;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'ualgeddit-storage-'));
    storage = new LocalDiskStorage(path.join(dir, 'uploads'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('stores images under random names using the detected extension', async () => {
    const [url] = await storage.saveImages([{ buffer: PNG_BYTES, originalname: 'evil.html' }]);
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(await readdir(path.join(dir, 'uploads'))).toHaveLength(1);
  });

  it('rejects the whole batch if any file is not an image', async () => {
    await expect(
      storage.saveImages([
        { buffer: PNG_BYTES },
        { buffer: Buffer.from('<script>alert(1)</script>') },
      ]),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
  });

  it('deletes stored files', async () => {
    const urls = await storage.saveImages([{ buffer: PNG_BYTES }]);
    await storage.deleteMany(urls);
    expect(await readdir(path.join(dir, 'uploads'))).toHaveLength(0);
  });

  it('ignores URLs it did not generate (no path traversal)', async () => {
    const victim = path.join(dir, 'victim.txt');
    await writeFile(victim, 'keep me');
    await storage.deleteMany(['/uploads/../victim.txt', '../../etc/passwd', null, undefined]);
    expect(await readdir(dir)).toContain('victim.txt');
  });
});
