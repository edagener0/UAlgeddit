import { describe, expect, it } from 'vitest';
import { durationToMs } from '../http/duration.js';
import { extractToken, parseCookieHeader, AUTH_COOKIE_NAME } from '../http/auth-cookie.js';
import { detectImageKind } from './image-signature.js';
import { paginate, toSkipTake } from './pagination.js';
import { hotRank, voteDelta } from './votes.js';

describe('voteDelta', () => {
  it.each([
    [0, 1, 1],
    [0, -1, -1],
    [1, -1, -2],
    [-1, 1, 2],
    [1, 0, -1],
    [-1, 0, 1],
    [1, 1, 0],
  ] as const)('%d -> %d = %d', (previous, next, expected) => {
    expect(voteDelta(previous, next)).toBe(expected);
  });
});

describe('hotRank', () => {
  const now = new Date('2026-06-01T12:00:00Z');

  it('ranks higher scores above lower scores at the same time', () => {
    expect(hotRank(100, now)).toBeGreaterThan(hotRank(10, now));
  });

  it('ranks newer posts above older posts with the same score', () => {
    const later = new Date(now.getTime() + 3_600_000);
    expect(hotRank(5, later)).toBeGreaterThan(hotRank(5, now));
  });

  it('penalises negative scores', () => {
    expect(hotRank(-10, now)).toBeLessThan(hotRank(0, now));
  });
});

describe('detectImageKind', () => {
  const pad = (bytes: number[]) => Uint8Array.from([...bytes, ...Array(16).fill(0)]);

  it.each([
    ['jpg', [0xff, 0xd8, 0xff, 0xe0]],
    ['png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['gif', [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    ['webp', [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ])('detects %s', (kind, bytes) => {
    expect(detectImageKind(pad(bytes))).toBe(kind);
  });

  it('rejects SVG / HTML disguised as images', () => {
    expect(detectImageKind(new TextEncoder().encode('<svg onload="alert(1)"></svg>'))).toBeNull();
  });

  it('rejects buffers that are too small', () => {
    expect(detectImageKind(Uint8Array.from([0xff, 0xd8]))).toBeNull();
  });
});

describe('pagination', () => {
  it('converts pages into skip/take', () => {
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('computes the number of pages (at least one)', () => {
    expect(paginate([], 0, { page: 1, pageSize: 20 }).totalPages).toBe(1);
    expect(paginate([1], 41, { page: 1, pageSize: 20 }).totalPages).toBe(3);
  });
});

describe('durationToMs', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['12h', 43_200_000],
    ['7d', 604_800_000],
  ])('%s', (value, expected) => {
    expect(durationToMs(value)).toBe(expected);
  });

  it('throws on invalid input', () => {
    expect(() => durationToMs('7 days')).toThrow();
  });
});

describe('auth cookie helpers', () => {
  it('prefers the cookie over the Authorization header', () => {
    expect(extractToken({ [AUTH_COOKIE_NAME]: 'cookie' }, 'Bearer header')).toBe('cookie');
  });

  it('falls back to a bearer token', () => {
    expect(extractToken({}, 'Bearer abc')).toBe('abc');
    expect(extractToken({}, 'Basic abc')).toBeNull();
    expect(extractToken(undefined, undefined)).toBeNull();
  });

  it('parses raw cookie headers', () => {
    expect(parseCookieHeader('a=1; b=hello%20world; broken; =x')).toEqual({
      a: '1',
      b: 'hello world',
    });
  });
});
