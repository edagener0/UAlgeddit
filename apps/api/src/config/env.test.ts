import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173']);
  });

  it('splits CORS origins and parses booleans', () => {
    const env = loadEnv({
      ...base,
      CORS_ORIGINS: 'http://a.com, http://b.com',
      COOKIE_SECURE: 'true',
    });
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it('rejects short JWT secrets with a readable message', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('requires DATABASE_URL', () => {
    expect(() => loadEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });
});
