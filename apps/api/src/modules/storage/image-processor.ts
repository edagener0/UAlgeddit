import sharp from 'sharp';
import { UnsupportedMediaTypeError } from '../../common/errors/app-error.js';
import type { ImageKind } from '../../common/utils/image-signature.js';

/** Size presets: content images keep detail, avatars/icons and banners are bounded tighter. */
export const IMAGE_PRESETS = {
  content: { width: 2048, height: 2048 },
  avatar: { width: 512, height: 512 },
  banner: { width: 1920, height: 640 },
} as const;
export type ImagePreset = keyof typeof IMAGE_PRESETS;

/** Rejects "pixel flood" images (tiny files declaring enormous dimensions). */
const MAX_INPUT_PIXELS = 40_000_000;

/**
 * Re-encodes an uploaded image to WebP. Decoding and re-encoding:
 * - strips every metadata block (EXIF GPS location, camera serials, comments…);
 * - drops anything appended to or hidden in the original file (polyglots);
 * - applies the EXIF orientation, bounds the dimensions and the decoded pixel count;
 * - keeps GIF/WebP animations.
 */
export async function processImage(
  buffer: Buffer,
  kind: ImageKind,
  preset: ImagePreset,
): Promise<Buffer> {
  const animated = kind === 'gif' || kind === 'webp';
  try {
    let pipeline = sharp(buffer, {
      animated,
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: 'error',
    });
    // Auto-orientation is only meaningful (and supported) for still images.
    if (!animated) pipeline = pipeline.rotate();
    return await pipeline
      .resize({ ...IMAGE_PRESETS[preset], fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    throw new UnsupportedMediaTypeError('The image is corrupted, too large or unsupported');
  }
}
