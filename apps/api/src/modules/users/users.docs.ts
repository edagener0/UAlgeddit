import { updateProfileSchema } from '@ualgeddit/shared';
import {
  authenticated,
  errors,
  json,
  jsonBody,
  multipartBody,
  pathParam,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

export const usersPaths: PathsObject = {
  '/users/{username}': {
    get: {
      tags: ['Users'],
      summary: 'Get a user profile',
      description: '`friendshipStatus` is relative to the authenticated viewer (if any).',
      parameters: [pathParam('username', { type: 'string' })],
      responses: { 200: json('User profile', ref('UserProfile')), 404: errors[404] },
    },
  },
  '/users/me': {
    patch: {
      tags: ['Users'],
      summary: 'Update my profile',
      security: authenticated,
      requestBody: jsonBody(updateProfileSchema),
      responses: {
        200: json('Updated profile', ref('UserProfile')),
        400: errors[400],
        401: errors[401],
      },
    },
  },
  '/users/me/avatar': {
    put: {
      tags: ['Users'],
      summary: 'Upload my avatar',
      security: authenticated,
      requestBody: multipartBody(null, {
        avatar: { description: 'JPEG, PNG, GIF or WebP, up to 5 MiB' },
      }),
      responses: {
        200: json('Updated user', ref('UserSummary')),
        401: errors[401],
        413: errors[413],
        415: errors[415],
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Remove my avatar',
      security: authenticated,
      responses: { 200: json('Updated user', ref('UserSummary')), 401: errors[401] },
    },
  },
};
