/** Maximum size of a single uploaded image, in bytes (5 MiB). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum number of images attached to a single post. */
export const MAX_POST_IMAGES = 10;

/** Maximum number of images attached to a single comment. */
export const MAX_COMMENT_IMAGES = 4;

/** MIME types accepted for every image upload. SVG is intentionally excluded (XSS vector). */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Deep offset pagination is expensive; nobody scrolls past this page. */
export const MAX_PAGE = 500;

/** Upper bound of comments loaded for a single post. */
export const MAX_COMMENTS_PER_POST = 2000;

/** Maximum depth of nested comment replies. */
export const MAX_COMMENT_DEPTH = 8;
