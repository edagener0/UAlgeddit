import type { Request } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';

export interface AuthenticatedUser {
  id: number;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by the authentication middleware when a valid token is present. */
      user?: AuthenticatedUser;
    }
  }
}

/** Returns the authenticated user or throws 401. */
export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
