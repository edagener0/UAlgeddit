export type ImageKind = 'jpg' | 'png' | 'gif' | 'webp';

const startsWith = (buffer: Uint8Array, bytes: number[], offset = 0) =>
  bytes.every((byte, index) => buffer[offset + index] === byte);

/**
 * Detects the real image type from its magic bytes. The client-provided MIME
 * type is never trusted, so a renamed HTML/SVG/executable file is rejected.
 */
export function detectImageKind(buffer: Uint8Array): ImageKind | null {
  if (buffer.length < 12) return null;
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38]) && [0x37, 0x39].includes(buffer[4] ?? 0)) {
    return 'gif';
  }
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'webp';
  }
  return null;
}
