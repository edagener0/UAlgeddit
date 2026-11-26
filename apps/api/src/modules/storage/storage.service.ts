import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from 'pino';
import { UnsupportedMediaTypeError } from '../../common/errors/app-error.js';
import { detectImageKind } from '../../common/utils/image-signature.js';
import { processImage, type ImagePreset } from './image-processor.js';

export type { ImagePreset } from './image-processor.js';

export interface ImageFile {
  buffer: Buffer;
  originalname?: string;
}

/** Abstraction over where uploaded images live (local disk today, S3 tomorrow). */
export interface StorageService {
  /**
   * Validates, sanitises (re-encodes) and stores every image, returning their public
   * URLs in order. All-or-nothing: nothing is kept if any image is rejected.
   */
  saveImages(files: ImageFile[], preset?: ImagePreset): Promise<string[]>;
  /** Best-effort removal; never throws. */
  deleteMany(urls: (string | null | undefined)[]): Promise<void>;
}

export const PUBLIC_UPLOADS_PATH = '/uploads';
const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|gif|webp|svg)$/;

export class LocalDiskStorage implements StorageService {
  private ready: Promise<unknown> | null = null;

  constructor(
    private readonly directory: string,
    private readonly logger?: Logger,
  ) {}

  async saveImages(files: ImageFile[], preset: ImagePreset = 'content'): Promise<string[]> {
    // 1. Cheap magic-byte check first: the client MIME type and file name are never trusted.
    const kinds = files.map((file) => {
      const kind = detectImageKind(file.buffer);
      if (!kind) {
        throw new UnsupportedMediaTypeError(
          `"${file.originalname ?? 'file'}" is not a valid JPEG, PNG, GIF or WebP image`,
        );
      }
      return kind;
    });

    // 2. Decode and re-encode everything before touching the disk (sequential: bounded CPU/RAM).
    const encoded: Buffer[] = [];
    for (const [index, file] of files.entries()) {
      encoded.push(await processImage(file.buffer, kinds[index]!, preset));
    }

    this.ready ??= mkdir(this.directory, { recursive: true });
    await this.ready;

    const written: string[] = [];
    try {
      for (const buffer of encoded) {
        const name = `${randomUUID()}.webp`;
        await writeFile(path.join(this.directory, name), buffer, { flag: 'wx' });
        written.push(`${PUBLIC_UPLOADS_PATH}/${name}`);
      }
      return written;
    } catch (error) {
      await this.deleteMany(written);
      throw error;
    }
  }

  async deleteMany(urls: (string | null | undefined)[]): Promise<void> {
    await Promise.all(
      urls.map(async (url) => {
        const name = this.fileNameFromUrl(url);
        if (!name) return;
        try {
          await unlink(path.join(this.directory, name));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            this.logger?.warn({ err: error, url }, 'Failed to delete stored image');
          }
        }
      }),
    );
  }

  /** Only accepts names this service generated, which rules out path traversal. */
  private fileNameFromUrl(url: string | null | undefined): string | null {
    if (!url?.startsWith(`${PUBLIC_UPLOADS_PATH}/`)) return null;
    const name = url.slice(PUBLIC_UPLOADS_PATH.length + 1);
    return STORED_NAME.test(name) ? name : null;
  }
}
