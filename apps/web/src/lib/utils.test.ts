import { describe, expect, it } from 'vitest';
import { cn, formatCount, formatRelativeTime } from './utils';

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    const hidden = false as boolean;
    expect(cn('px-2', hidden && 'hidden', 'px-4')).toBe('px-4');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it.each([
    ['2026-06-15T11:59:50Z', 'now'],
    ['2026-06-15T11:55:00Z', '5 min. ago'],
    ['2026-06-15T09:00:00Z', '3 hr. ago'],
    ['2026-06-14T12:00:00Z', 'yesterday'],
    ['2025-06-15T12:00:00Z', 'last yr.'],
  ])('%s -> %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

describe('formatCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1_234, '1.2K'],
    [-1_500, '-1.5K'],
    [2_000_000, '2M'],
  ])('%d -> %s', (value, expected) => {
    expect(formatCount(value)).toBe(expected);
  });
});
