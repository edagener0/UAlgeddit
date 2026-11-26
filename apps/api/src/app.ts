import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { Env } from './config/env.js';
import type { Container } from './container.js';
import { optionalAuth } from './common/middleware/authenticate.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { originCheck } from './common/middleware/origin-check.js';
import { apiRateLimit, authRateLimit } from './common/middleware/rate-limit.js';
import { buildOpenApiDocument } from './docs/openapi.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createChatRouter } from './modules/chat/chat.routes.js';
import { createCommentsRouter } from './modules/comments/comments.routes.js';
import { createFriendsRouter } from './modules/friends/friends.routes.js';
import { createPostsRouter } from './modules/posts/posts.routes.js';
import { PUBLIC_UPLOADS_PATH } from './modules/storage/storage.service.js';
import { createSubgedditsRouter } from './modules/subgeddits/subgeddits.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';

export function createApp(env: Env, container: Container, logger: Logger): Express {
  const app = express();
  const { controllers, services } = container;

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, error) =>
        error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    }),
  );
  app.use(
    helmet({
      // Uploaded images are embedded by the web client, which may live on another origin in dev.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  // Fits the longest allowed post body (40,000 characters of up to 4 UTF-8 bytes).
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  // Uploaded images: long-lived cache, no sniffing, and sandboxed if opened directly.
  app.use(
    PUBLIC_UPLOADS_PATH,
    express.static(path.resolve(env.UPLOAD_DIR), {
      immutable: true,
      maxAge: '365d',
      index: false,
      setHeaders: (res) => {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        );
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  // API documentation, development only by default (Swagger UI needs inline scripts,
  // so CSP is relaxed for this route only). In production the routes do not exist (404).
  if (env.API_DOCS_ENABLED) {
    const openApiDocument = buildOpenApiDocument();
    app.get('/api/docs/openapi.json', (_req, res) => {
      res.json(openApiDocument);
    });
    app.use(
      '/api/docs',
      helmet({ contentSecurityPolicy: false }),
      swaggerUi.serve,
      swaggerUi.setup(openApiDocument, {
        customSiteTitle: 'UAlgeddit API',
        swaggerOptions: { withCredentials: true, persistAuthorization: true },
      }),
    );
  }

  app.get('/api/health', async (_req, res) => {
    try {
      await container.db.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'error', database: 'down' });
    }
  });

  const api = express.Router();
  api.use(apiRateLimit(env.RATE_LIMIT_ENABLED));
  api.use(originCheck(env.CORS_ORIGINS));
  api.use(optionalAuth(services.auth));
  api.use('/auth', createAuthRouter(controllers.auth, authRateLimit(env.RATE_LIMIT_ENABLED)));
  api.use('/users', createUsersRouter(controllers.users));
  api.use('/subgeddits', createSubgedditsRouter(controllers.subgeddits));
  api.use('/posts', createPostsRouter(controllers.posts, controllers.comments));
  api.use('/comments', createCommentsRouter(controllers.comments));
  api.use('/friends', createFriendsRouter(controllers.friends));
  api.use('/chat', createChatRouter(controllers.chat));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
