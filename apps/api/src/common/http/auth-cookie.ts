import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'ualgeddit_token';

export function authCookieOptions(secure: boolean, maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    ...(maxAgeMs !== undefined && { maxAge: maxAgeMs }),
  };
}

export function setAuthCookie(res: Response, token: string, secure: boolean, maxAgeMs: number) {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions(secure, maxAgeMs));
}

export function clearAuthCookie(res: Response, secure: boolean) {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions(secure));
}

/** Extracts a JWT from the auth cookie or from an `Authorization: Bearer` header. */
export function extractToken(
  cookies: Record<string, string | undefined> | undefined,
  authorization: string | undefined,
): string | null {
  const fromCookie = cookies?.[AUTH_COOKIE_NAME];
  if (fromCookie) return fromCookie;
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    return token || null;
  }
  return null;
}

/** Parses a raw `Cookie` header (used for WebSocket upgrades, which bypass Express). */
export function parseCookieHeader(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}
