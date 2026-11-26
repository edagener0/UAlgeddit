import { loginSchema, registerSchema } from '@ualgeddit/shared';
import {
  authenticated,
  errors,
  json,
  jsonBody,
  noContent,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

export const authPaths: PathsObject = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Create an account',
      description: 'Creates the user and signs them in (sets the httpOnly auth cookie).',
      requestBody: jsonBody(registerSchema),
      responses: {
        201: json('Account created', ref('AuthResponse')),
        400: errors[400],
        409: errors[409],
        429: errors[429],
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Sign in',
      requestBody: jsonBody(loginSchema),
      responses: {
        200: json('Signed in', ref('AuthResponse')),
        400: errors[400],
        401: errors[401],
        429: errors[429],
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Sign out',
      description: 'Clears the auth cookie and revokes every token issued to the user.',
      security: authenticated,
      responses: { 204: noContent('Signed out') },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Current user',
      security: authenticated,
      responses: { 200: json('The authenticated user', ref('UserSummary')), 401: errors[401] },
    },
  },
};
