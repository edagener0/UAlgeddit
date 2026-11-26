import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';

const passThrough: RequestHandler = (_req, _res, next) => next();
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** IPv6 addresses are grouped by /56 so one host cannot rotate through its whole range. */
const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? '0.0.0.0');

function limiter(
  enabled: boolean,
  windowMs: number,
  limit: number,
  message: string,
  options: Partial<Options> = {},
): RequestHandler {
  if (!enabled) return passThrough;
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message } });
    },
    ...options,
  });
}

/** Generous global limit for the whole API, per IP. */
export const apiRateLimit = (enabled: boolean) =>
  limiter(enabled, 60_000, 600, 'Too many requests, please slow down');

/** Strict per-IP limit for login/register to slow down credential stuffing. */
export const authRateLimit = (enabled: boolean) =>
  limiter(enabled, 15 * 60_000, 30, 'Too many authentication attempts, try again later');

/**
 * Per-account brute-force protection: failed logins are counted per username, so a
 * distributed attack against one account is throttled too. Successful logins do not count.
 */
export const loginAccountRateLimit = (enabled: boolean) =>
  limiter(enabled, 15 * 60_000, 10, 'Too many failed attempts for this account, try again later', {
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const username = (req.body as { username?: unknown } | undefined)?.username;
      return typeof username === 'string'
        ? `user:${username.trim().toLowerCase()}`
        : `ip:${clientIp(req)}`;
    },
  });

/**
 * Per-user limit on state-changing requests (posts, comments, votes, friend requests…).
 * Must run after authentication; anonymous requests fall back to the client IP.
 */
export const writeRateLimit = (enabled: boolean) =>
  limiter(enabled, 60_000, 60, 'You are doing that too often, please slow down', {
    skip: (req) => SAFE_METHODS.has(req.method),
    keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${clientIp(req)}`),
  });
