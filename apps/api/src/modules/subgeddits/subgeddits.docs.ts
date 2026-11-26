import {
  createSubgedditSchema,
  listSubgedditsQuerySchema,
  updateSubgedditSchema,
} from '@ualgeddit/shared';
import { paginated } from '../../docs/components.js';
import {
  authenticated,
  errors,
  json,
  multipartBody,
  noContent,
  pathParam,
  queryParams,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

const images = {
  icon: { description: 'Square community icon (optional)' },
  banner: { description: 'Wide community banner (optional)' },
};
const name = pathParam('name', { type: 'string' });

export const subgedditsPaths: PathsObject = {
  '/subgeddits': {
    get: {
      tags: ['Subgeddits'],
      summary: 'List subgeddits',
      parameters: queryParams(listSubgedditsQuerySchema),
      responses: { 200: json('A page of subgeddits', paginated('Subgeddit')) },
    },
    post: {
      tags: ['Subgeddits'],
      summary: 'Create a subgeddit',
      security: authenticated,
      requestBody: multipartBody(createSubgedditSchema, images),
      responses: {
        201: json('Created subgeddit', ref('Subgeddit')),
        400: errors[400],
        401: errors[401],
        409: errors[409],
        415: errors[415],
      },
    },
  },
  '/subgeddits/{name}': {
    get: {
      tags: ['Subgeddits'],
      summary: 'Get a subgeddit by name',
      parameters: [name],
      responses: { 200: json('Subgeddit', ref('Subgeddit')), 404: errors[404] },
    },
    patch: {
      tags: ['Subgeddits'],
      summary: 'Update a subgeddit (owner only)',
      security: authenticated,
      parameters: [name],
      requestBody: multipartBody(updateSubgedditSchema, images),
      responses: {
        200: json('Updated subgeddit', ref('Subgeddit')),
        401: errors[401],
        403: errors[403],
        404: errors[404],
      },
    },
    delete: {
      tags: ['Subgeddits'],
      summary: 'Delete a subgeddit and all its posts (owner only)',
      security: authenticated,
      parameters: [name],
      responses: {
        204: noContent('Deleted'),
        401: errors[401],
        403: errors[403],
        404: errors[404],
      },
    },
  },
};
