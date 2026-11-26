import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_COMMENT_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_POST_IMAGES,
} from '@ualgeddit/shared';
import multer from 'multer';
import { UnsupportedMediaTypeError } from '../errors/app-error.js';

const allowed = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

/**
 * Multer instance that keeps files in memory (they are validated by magic bytes
 * and persisted by the storage service afterwards).
 */
function imageUpload(maxFiles: number) {
  return multer({
    storage: multer.memoryStorage(),
    // fieldSize fits the longest allowed post body (40,000 characters of up to 4 UTF-8 bytes).
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: maxFiles, fields: 20, fieldSize: 256 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (allowed.has(file.mimetype)) {
        callback(null, true);
        return;
      }
      callback(
        new UnsupportedMediaTypeError(
          `Unsupported image type "${file.mimetype}". Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
        ),
      );
    },
  });
}

export const postImagesUpload = imageUpload(MAX_POST_IMAGES).array('images', MAX_POST_IMAGES);
export const commentImagesUpload = imageUpload(MAX_COMMENT_IMAGES).array(
  'images',
  MAX_COMMENT_IMAGES,
);
export const avatarUpload = imageUpload(1).single('avatar');
export const subgedditImagesUpload = imageUpload(2).fields([
  { name: 'icon', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

export type UploadedFile = Express.Multer.File;

/** Normalises `req.files` for `.fields()` uploads. */
export function fieldFile(
  files: Express.Request['files'],
  field: string,
): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) return undefined;
  return files[field]?.[0];
}

/** Normalises `req.files` for `.array()` uploads. */
export function arrayFiles(files: Express.Request['files']): Express.Multer.File[] {
  return Array.isArray(files) ? files : [];
}
