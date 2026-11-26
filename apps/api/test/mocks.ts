import { vi, type Mocked } from 'vitest';
import type { StorageService } from '../src/modules/storage/storage.service.js';

/** Creates an object whose listed methods are `vi.fn()` mocks, typed as `T`. */
export function mockOf<T>(...methods: (keyof T)[]): Mocked<T> {
  return Object.fromEntries(methods.map((method) => [method, vi.fn()])) as unknown as Mocked<T>;
}

export function mockStorage(): Mocked<StorageService> {
  return {
    saveImages: vi.fn<StorageService['saveImages']>(async (files) =>
      files.map((_, index) => `/uploads/img-${index}.png`),
    ),
    deleteMany: vi.fn<StorageService['deleteMany']>(async () => undefined),
  };
}

/** A minimal valid PNG signature padded to 16 bytes. */
export const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
]);
