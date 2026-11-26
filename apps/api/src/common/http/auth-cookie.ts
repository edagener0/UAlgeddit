import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'ualgeddit_token';

/**
 * Over HTTPS the `__Host-` prefix is used: browsers only accept it when it is Secure,
 * has `Path=/` and no `Domain`, so a sibling subdomain can never set or shadow it.
 */
export const SECURE_AUTH_COOKIE_NAME = `__Host-${AUTH_COOKIE_NAME}`;

export const authCookieName = (secure: boolean) =>
  secure ? SECURE_AUTH_COOKIE_NAME : AUTH_COOKIE_NAME;

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
  res.cookie(authCookieName(secure), token, authCookieOptions(secure, maxAgeMs));
}

export function clearAuthCookie(res: Response, secure: boolean) {
  res.clearCookie(authCookieName(secure), authCookieOptions(secure));
}

/**
 * Extracts the session JWT. Authentication is cookie-only: the token lives in an
 * httpOnly cookie that page scripts cannot read, so `Authorization` headers are ignored.
 */
export function extractToken(
  cookies: Record<string, string | undefined> | undefined,
): string | null {
  return cookies?.[SECURE_AUTH_COOKIE_NAME] || cookies?.[AUTH_COOKIE_NAME] || null;
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
