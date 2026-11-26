import { describe, expect, it } from 'vitest';
import {
  createCommentSchema,
  createPostSchema,
  createSubgedditSchema,
  listPostsQuerySchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
  voteSchema,
} from '../index.js';

describe('registerSchema', () => {
  const valid = { username: 'alice_01', password: 'secret123', confirmPassword: 'secret123' };

  it('accepts a valid payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatching passwords on the confirmPassword path', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'other123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it.each(['ab', 'has space', 'a'.repeat(21), 'emoji😀'])('rejects username %j', (username) => {
    expect(registerSchema.safeParse({ ...valid, username }).success).toBe(false);
  });

  it.each(['short1', 'onlyletters', '12345678', 'a1'.repeat(40)])('rejects password %j', (pw) => {
    expect(registerSchema.safeParse({ ...valid, password: pw, confirmPassword: pw }).success).toBe(
      false,
    );
  });

  it('rejects passwords longer than 72 UTF-8 bytes (bcrypt would truncate them)', () => {
    const pw = 'aé1'.repeat(24); // 72 characters, 96 bytes
    const result = registerSchema.safeParse({ ...valid, password: pw, confirmPassword: pw });
    expect(result.success).toBe(false);
  });

  it('trims the username', () => {
    expect(registerSchema.parse({ ...valid, username: '  bob  ' }).username).toBe('bob');
  });
});

describe('loginSchema', () => {
  it('requires both fields', () => {
    expect(loginSchema.safeParse({ username: '', password: '' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts null values to clear fields', () => {
    expect(updateProfileSchema.safeParse({ bio: null, birthday: null }).success).toBe(true);
  });

  it('rejects a birthday in the future', () => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    const result = updateProfileSchema.safeParse({ birthday: next.toISOString().slice(0, 10) });
    expect(result.success).toBe(false);
  });

  it('rejects malformed dates', () => {
    expect(updateProfileSchema.safeParse({ birthday: '31/12/2000' }).success).toBe(false);
  });
});

describe('createSubgedditSchema', () => {
  it('defaults the description to an empty string', () => {
    expect(createSubgedditSchema.parse({ name: 'typescript' }).description).toBe('');
  });

  it('rejects names with dashes', () => {
    expect(createSubgedditSchema.safeParse({ name: 'type-script' }).success).toBe(false);
  });
});

describe('createPostSchema', () => {
  it('coerces the subgeddit id coming from multipart forms', () => {
    const parsed = createPostSchema.parse({ subgedditId: '4', title: 'Hello' });
    expect(parsed).toEqual({ subgedditId: 4, title: 'Hello', content: '' });
  });

  it('rejects blank titles', () => {
    expect(createPostSchema.safeParse({ subgedditId: 1, title: '   ' }).success).toBe(false);
  });
});

describe('createCommentSchema', () => {
  it('coerces parentId', () => {
    expect(createCommentSchema.parse({ content: 'hi', parentId: '7' }).parentId).toBe(7);
  });
});

describe('listPostsQuerySchema', () => {
  it('applies defaults', () => {
    expect(listPostsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20, sort: 'hot' });
  });

  it('caps the page number', () => {
    expect(listPostsQuerySchema.safeParse({ page: '501' }).success).toBe(false);
  });

  it('caps the page size', () => {
    expect(listPostsQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
  });
});

describe('voteSchema', () => {
  it.each([1, 0, -1])('accepts %d', (value) => {
    expect(voteSchema.safeParse({ value }).success).toBe(true);
  });

  it('rejects other values', () => {
    expect(voteSchema.safeParse({ value: 2 }).success).toBe(false);
  });
});
