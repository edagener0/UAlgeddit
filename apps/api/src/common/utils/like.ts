/**
 * Escapes the LIKE wildcards (`%`, `_`) and the escape character itself, so user
 * search input is matched literally (Prisma's `contains` does not escape them).
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
