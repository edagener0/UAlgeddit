import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import type { RequestHandler } from 'express';

const passThrough: RequestHandler = (_req, _res, next) => next();

function limiter(enabled: boolean, windowMs: number, limit: number, message: string) {
  if (!enabled) return passThrough;
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message } });
    },
  }) satisfies RateLimitRequestHandler;
}

/** Generous global limit for the whole API. */
export const apiRateLimit = (enabled: boolean) =>
  limiter(enabled, 60_000, 600, 'Too many requests, please slow down');

/** Strict limit for login/register to slow down credential stuffing. */
export const authRateLimit = (enabled: boolean) =>
  limiter(enabled, 15 * 60_000, 30, 'Too many authentication attempts, try again later');
