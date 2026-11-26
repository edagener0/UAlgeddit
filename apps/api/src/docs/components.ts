/** Response schemas (the TypeScript DTO interfaces in @ualgeddit/shared, written as JSON Schema). */
const dateTime = { type: 'string', format: 'date-time' };
const voteValue = { type: 'integer', enum: [-1, 0, 1] };
const nullableString = { type: ['string', 'null'] };

export const schemas = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { path: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  UserSummary: {
    type: 'object',
    required: ['id', 'username', 'avatarUrl'],
    properties: {
      id: { type: 'integer' },
      username: { type: 'string' },
      avatarUrl: nullableString,
    },
  },
  AuthResponse: {
    type: 'object',
    required: ['user', 'token'],
    properties: {
      user: { $ref: '#/components/schemas/UserSummary' },
      token: { type: 'string', description: 'JWT (also set as the httpOnly auth cookie)' },
    },
  },
  UserProfile: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      username: { type: 'string' },
      avatarUrl: nullableString,
      bio: nullableString,
      birthday: { type: ['string', 'null'], format: 'date' },
      karma: { type: 'integer' },
      createdAt: dateTime,
      friendCount: { type: 'integer' },
      postCount: { type: 'integer' },
      friendshipStatus: {
        type: 'string',
        enum: ['self', 'none', 'friends', 'request_sent', 'request_received'],
      },
    },
  },
  Image: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      url: { type: 'string', example: '/uploads/3f0c...png' },
      position: { type: 'integer' },
    },
  },
  Subgeddit: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      description: { type: 'string' },
      iconUrl: nullableString,
      bannerUrl: nullableString,
      createdAt: dateTime,
      owner: { $ref: '#/components/schemas/UserSummary' },
      postCount: { type: 'integer' },
    },
  },
  Post: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      title: { type: 'string' },
      content: { type: 'string' },
      createdAt: dateTime,
      editedAt: { ...dateTime, type: ['string', 'null'] },
      score: { type: 'integer' },
      commentCount: { type: 'integer' },
      myVote: voteValue,
      images: { type: 'array', items: { $ref: '#/components/schemas/Image' } },
      author: { $ref: '#/components/schemas/UserSummary' },
      subgeddit: {
        type: 'object',
        properties: { id: { type: 'integer' }, name: { type: 'string' }, iconUrl: nullableString },
      },
    },
  },
  Comment: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      postId: { type: 'integer' },
      parentId: { type: ['integer', 'null'] },
      content: { type: 'string' },
      deleted: { type: 'boolean' },
      createdAt: dateTime,
      score: { type: 'integer' },
      myVote: voteValue,
      author: {
        oneOf: [{ $ref: '#/components/schemas/UserSummary' }, { type: 'null' }],
      },
      images: { type: 'array', items: { $ref: '#/components/schemas/Image' } },
      replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
    },
  },
  VoteResult: {
    type: 'object',
    properties: { score: { type: 'integer' }, myVote: voteValue },
  },
  Friend: {
    allOf: [
      { $ref: '#/components/schemas/UserSummary' },
      { type: 'object', properties: { since: dateTime } },
    ],
  },
  FriendRequests: {
    type: 'object',
    properties: {
      received: {
        type: 'array',
        items: {
          type: 'object',
          properties: { from: { $ref: '#/components/schemas/UserSummary' }, createdAt: dateTime },
        },
      },
      sent: {
        type: 'array',
        items: {
          type: 'object',
          properties: { to: { $ref: '#/components/schemas/UserSummary' }, createdAt: dateTime },
        },
      },
    },
  },
  ChatMessage: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      content: { type: 'string' },
      createdAt: dateTime,
      author: { $ref: '#/components/schemas/UserSummary' },
    },
  },
};

export function paginated(itemRef: string) {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: `#/components/schemas/${itemRef}` } },
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  };
}
