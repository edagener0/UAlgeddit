import { sendFriendRequestSchema } from '@ualgeddit/shared';
import {
  authenticated,
  errors,
  json,
  jsonBody,
  noContent,
  pathParam,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

const userId = pathParam('userId');
const deleted = (summary: string) => ({
  tags: ['Friends'],
  summary,
  security: authenticated,
  parameters: [userId],
  responses: { 204: noContent('Done'), 401: errors[401], 404: errors[404] },
});

export const friendsPaths: PathsObject = {
  '/friends': {
    get: {
      tags: ['Friends'],
      summary: 'List my friends',
      security: authenticated,
      responses: {
        200: json('Friends', { type: 'array', items: ref('Friend') }),
        401: errors[401],
      },
    },
  },
  '/friends/requests': {
    get: {
      tags: ['Friends'],
      summary: 'List my pending friend requests',
      security: authenticated,
      responses: {
        200: json('Received and sent requests', ref('FriendRequests')),
        401: errors[401],
      },
    },
    post: {
      tags: ['Friends'],
      summary: 'Send a friend request',
      description: 'If the target already sent you a request, you become friends immediately.',
      security: authenticated,
      requestBody: jsonBody(sendFriendRequestSchema),
      responses: {
        201: json('Resulting status', {
          type: 'object',
          properties: { status: { type: 'string', enum: ['request_sent', 'friends'] } },
        }),
        400: errors[400],
        401: errors[401],
        404: errors[404],
        409: errors[409],
      },
    },
  },
  '/friends/requests/{userId}/accept': {
    post: {
      tags: ['Friends'],
      summary: 'Accept a friend request',
      security: authenticated,
      parameters: [userId],
      responses: { 204: noContent('Accepted'), 401: errors[401], 404: errors[404] },
    },
  },
  '/friends/requests/received/{userId}': { delete: deleted('Decline a received request') },
  '/friends/requests/sent/{userId}': { delete: deleted('Cancel a sent request') },
  '/friends/{userId}': { delete: deleted('Unfriend a user') },
};
