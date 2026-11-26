import type { RequestHandler } from 'express';
import { ForbiddenError } from '../errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Returns true when `origin` is allowed or is the API's own origin. */
export function isAllowedOrigin(origin: string, allowed: string[], host: string | undefined) {
  if (allowed.includes(origin)) return true;
  try {
    return host !== undefined && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Defence-in-depth against CSRF on cookie-authenticated requests: state-changing
 * requests that carry an `Origin` header must come from an allowed origin.
 * (The auth cookie is also `SameSite=Lax`.)
 */
export function originCheck(allowedOrigins: string[]): RequestHandler {
  return (req, _res, next) => {
    const origin = req.headers.origin;
    if (SAFE_METHODS.has(req.method) || !origin) {
      next();
      return;
    }
    if (isAllowedOrigin(origin, allowedOrigins, req.headers.host)) {
      next();
      return;
    }
    next(new ForbiddenError('Cross-origin request blocked'));
  };
}
