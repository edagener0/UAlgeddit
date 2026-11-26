import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './origin-check.js';

describe('isAllowedOrigin', () => {
  const allowed = ['http://localhost:5173'];

  it('accepts listed origins', () => {
    expect(isAllowedOrigin('http://localhost:5173', allowed, 'api:3000')).toBe(true);
  });

  it("accepts the API's own origin", () => {
    expect(isAllowedOrigin('http://localhost:3000', allowed, 'localhost:3000')).toBe(true);
  });

  it('rejects other origins and garbage', () => {
    expect(isAllowedOrigin('https://evil.example', allowed, 'localhost:3000')).toBe(false);
    expect(isAllowedOrigin('not a url', allowed, 'localhost:3000')).toBe(false);
  });
});
