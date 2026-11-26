import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@ualgeddit/shared';

const allowed = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(',');

/** Client-side pre-check mirroring the server rules; returns an error message or null. */
export function validateImage(file: File): string | null {
  if (!allowed.has(file.type)) return `"${file.name}" is not a JPEG, PNG, GIF or WebP image`;
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `"${file.name}" is larger than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB`;
  }
  return null;
}
