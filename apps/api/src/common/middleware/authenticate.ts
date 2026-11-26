import type { RequestHandler } from 'express';
import { extractToken } from '../http/auth-cookie.js';
import { UnauthorizedError } from '../errors/app-error.js';
import type { AuthenticatedUser } from '../http/types.js';

export interface TokenAuthenticator {
  authenticate(token: string): Promise<AuthenticatedUser | null>;
}

/**
 * Populates `req.user` when the request carries a valid token.
 * Never rejects the request: use {@link requireAuth} on protected routes.
 */
export function optionalAuth(authenticator: TokenAuthenticator): RequestHandler {
  return async (req, _res, next) => {
    const token = extractToken(req.cookies);
    if (token) {
      req.user = (await authenticator.authenticate(token)) ?? undefined;
    }
    next();
  };
}

/** Rejects the request with 401 unless `optionalAuth` resolved a user. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  next();
};
