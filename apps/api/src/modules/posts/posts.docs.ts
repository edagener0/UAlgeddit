import {
  createPostSchema,
  listPostsQuerySchema,
  MAX_POST_IMAGES,
  updatePostSchema,
  voteSchema,
} from '@ualgeddit/shared';
import { paginated } from '../../docs/components.js';
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

export const postsPaths: PathsObject = {
  '/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List / search posts',
      description: 'Feed of posts, optionally filtered by subgeddit, author or text query.',
      parameters: queryParams(listPostsQuerySchema),
      responses: { 200: json('A page of posts', paginated('Post')), 400: errors[400] },
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a post',
      security: authenticated,
      requestBody: multipartBody(createPostSchema, {
        images: { multiple: true, description: `Up to ${MAX_POST_IMAGES} images (5 MiB each)` },
      }),
      responses: {
        201: json('Created post', ref('Post')),
        400: errors[400],
        401: errors[401],
        404: errors[404],
        413: errors[413],
        415: errors[415],
      },
    },
  },
  '/posts/{id}': {
    get: {
      tags: ['Posts'],
      summary: 'Get a post',
      parameters: [id],
      responses: { 200: json('Post', ref('Post')), 404: errors[404] },
    },
    patch: {
      tags: ['Posts'],
      summary: 'Edit a post (author only)',
      security: authenticated,
      parameters: [id],
      requestBody: jsonBody(updatePostSchema),
      responses: {
        200: json('Updated post', ref('Post')),
        401: errors[401],
        403: errors[403],
        404: errors[404],
      },
    },
    delete: {
      tags: ['Posts'],
      summary: 'Delete a post (author only)',
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
  '/posts/{id}/vote': {
    put: {
      tags: ['Posts'],
      summary: 'Vote on a post',
      description: '`1` upvotes, `-1` downvotes and `0` removes the vote. Idempotent.',
      security: authenticated,
      parameters: [id],
      requestBody: jsonBody(voteSchema),
      responses: { 200: json('New score', ref('VoteResult')), 401: errors[401], 404: errors[404] },
    },
  },
};
