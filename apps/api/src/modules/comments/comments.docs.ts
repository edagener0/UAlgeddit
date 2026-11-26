import {
  createCommentSchema,
  listCommentsQuerySchema,
  MAX_COMMENT_IMAGES,
  voteSchema,
} from '@ualgeddit/shared';
import {
  authenticated,
  errors,
  json,
  jsonBody,
  multipartBody,
  noContent,
  pathParam,
  queryParams,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

const id = pathParam('id');

export const commentsPaths: PathsObject = {
  '/posts/{id}/comments': {
    get: {
      tags: ['Comments'],
      summary: 'Get the comment tree of a post',
      parameters: [id, ...queryParams(listCommentsQuerySchema)],
      responses: {
        200: json('Nested comments', { type: 'array', items: ref('Comment') }),
        404: errors[404],
      },
    },
    post: {
      tags: ['Comments'],
      summary: 'Comment on a post or reply to a comment',
      security: authenticated,
      parameters: [id],
      requestBody: multipartBody(createCommentSchema, {
        images: { multiple: true, description: `Up to ${MAX_COMMENT_IMAGES} images` },
      }),
      responses: {
        201: json('Created comment', ref('Comment')),
        400: errors[400],
        401: errors[401],
        404: errors[404],
      },
    },
  },
  '/comments/{id}': {
    delete: {
      tags: ['Comments'],
      summary: 'Delete a comment (author only)',
      description: 'Soft delete: the comment stays as "[deleted]" if it has replies.',
      security: authenticated,
      parameters: [id],
      responses: {
        204: noContent('Deleted'),
        401: errors[401],
        403: errors[403],
        404: errors[404],
      },
    },
  },
  '/comments/{id}/vote': {
    put: {
      tags: ['Comments'],
      summary: 'Vote on a comment',
      security: authenticated,
      parameters: [id],
      requestBody: jsonBody(voteSchema),
      responses: { 200: json('New score', ref('VoteResult')), 401: errors[401], 404: errors[404] },
    },
  },
};
