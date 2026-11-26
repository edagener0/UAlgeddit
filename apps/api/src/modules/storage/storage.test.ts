import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnsupportedMediaTypeError } from '../../common/errors/app-error.js';
import { PNG_BYTES } from '../../../test/mocks.js';
import { LocalDiskStorage } from './storage.service.js';

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#ff4500' } });

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

  const stored = async (url: string) =>
    readFile(path.join(dir, 'uploads', url.replace('/uploads/', '')));

  it('re-encodes images to WebP under random names', async () => {
    const png = await solid(64, 64).png().toBuffer();
    const [url] = await storage.saveImages([{ buffer: png, originalname: 'evil.html' }]);
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.webp$/);
    expect((await sharp(await stored(url!)).metadata()).format).toBe('webp');
  });

  it('strips EXIF metadata such as GPS coordinates', async () => {
    const jpeg = await solid(64, 64)
      .jpeg()
      .withExif({
        IFD0: { Copyright: 'secret' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '37/1 1/1 0/1' },
      })
      .toBuffer();
    expect((await sharp(jpeg).metadata()).exif).toBeDefined();

    const [url] = await storage.saveImages([{ buffer: jpeg }]);
    const metadata = await sharp(await stored(url!)).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
  });

  it('bounds the dimensions according to the preset', async () => {
    const wide = await solid(3000, 1000).png().toBuffer();
    const [content] = await storage.saveImages([{ buffer: wide }]);
    const [avatar] = await storage.saveImages([{ buffer: wide }], 'avatar');
    expect((await sharp(await stored(content!)).metadata()).width).toBe(2048);
    expect((await sharp(await stored(avatar!)).metadata()).width).toBe(512);
  });

  it('keeps animations', async () => {
    const frames = await sharp({
      create: { width: 16, height: 32, channels: 3, background: '#00f' },
    })
      .gif({ loop: 0 })
      .toBuffer();
    const animated = await sharp(frames, { animated: true }).metadata();
    const [url] = await storage.saveImages([{ buffer: frames }]);
    const out = await sharp(await stored(url!), { animated: true }).metadata();
    expect(out.pages ?? 1).toBe(animated.pages ?? 1);
  });

  it('rejects pixel-flood images', async () => {
    const huge = await solid(8000, 6000).png({ compressionLevel: 9 }).toBuffer();
    await expect(storage.saveImages([{ buffer: huge }])).rejects.toBeInstanceOf(
      UnsupportedMediaTypeError,
    );
  });

  it('rejects files that only have a valid signature', async () => {
    await expect(storage.saveImages([{ buffer: PNG_BYTES }])).rejects.toBeInstanceOf(
      UnsupportedMediaTypeError,
    );
  });

  it('rejects the whole batch if any file is not an image', async () => {
    const png = await solid(8, 8).png().toBuffer();
    await expect(
      storage.saveImages([{ buffer: png }, { buffer: Buffer.from('<script>alert(1)</script>') }]),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
    await expect(readdir(path.join(dir, 'uploads'))).rejects.toThrow();
  });

  it('deletes stored files', async () => {
    const urls = await storage.saveImages([{ buffer: await solid(8, 8).png().toBuffer() }]);
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
