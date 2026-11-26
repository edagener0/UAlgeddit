import { authPaths } from '../modules/auth/auth.docs.js';
import { chatPaths } from '../modules/chat/chat.docs.js';
import { commentsPaths } from '../modules/comments/comments.docs.js';
import { friendsPaths } from '../modules/friends/friends.docs.js';
import { postsPaths } from '../modules/posts/posts.docs.js';
import { subgedditsPaths } from '../modules/subgeddits/subgeddits.docs.js';
import { usersPaths } from '../modules/users/users.docs.js';
import { AUTH_COOKIE_NAME } from '../common/http/auth-cookie.js';
import { schemas } from './components.js';
import { json } from './helpers.js';

/** Builds the OpenAPI 3.1 document served at `/api/docs`. */
export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'UAlgeddit API',
      version: '2.0.0',
      description:
        'REST API of UAlgeddit, a Reddit-like community platform. Authentication is cookie-based: ' +
        '`POST /auth/login` sets an httpOnly, SameSite=Lax session cookie that the browser (and ' +
        'this page) sends automatically. The token is never exposed to JavaScript.',
    },
    servers: [{ url: '/api' }],
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Subgeddits', description: 'Communities' },
      { name: 'Posts' },
      { name: 'Comments' },
      { name: 'Friends' },
      { name: 'Chat' },
      { name: 'System' },
    ],
    paths: {
      ...authPaths,
      ...usersPaths,
      ...subgedditsPaths,
      ...postsPaths,
      ...commentsPaths,
      ...friendsPaths,
      ...chatPaths,
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Liveness / readiness probe',
          responses: {
            200: json('Healthy', {
              type: 'object',
              properties: { status: { const: 'ok' }, database: { const: 'up' } },
            }),
            503: { description: 'Database unreachable' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: AUTH_COOKIE_NAME },
      },
      schemas,
    },
  };
}
