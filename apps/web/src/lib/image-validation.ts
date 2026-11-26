import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@ualgeddit/shared';
import i18n from '@/i18n';

const allowed = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(',');

/** Client-side pre-check mirroring the server rules; returns a translated error or null. */
export function validateImage(file: File): string | null {
  if (!allowed.has(file.type)) return i18n.t('picker.invalidType', { name: file.name });
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return i18n.t('picker.tooLarge', { name: file.name, size: MAX_IMAGE_SIZE_BYTES / 1024 / 1024 });
  }
  return null;
}
