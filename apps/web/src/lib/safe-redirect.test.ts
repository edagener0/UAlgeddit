import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it.each(['/', '/posts/1', '/g/typescript?sort=top', '/u/alice#comments'])('allows %s', (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each([
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'posts/1',
    '',
    42,
    null,
    undefined,
  ])('rejects %j', (target) => {
    expect(safeRedirect(target)).toBe('/');
  });
});
