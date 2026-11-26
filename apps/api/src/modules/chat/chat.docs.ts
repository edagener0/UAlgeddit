import { chatHistoryQuerySchema } from '@ualgeddit/shared';
import {
  authenticated,
  errors,
  json,
  queryParams,
  ref,
  type PathsObject,
} from '../../docs/helpers.js';

export const chatPaths: PathsObject = {
  '/chat/messages': {
    get: {
      tags: ['Chat'],
      summary: 'Recent global chat messages',
      description: [
        'Real-time messages flow over the WebSocket at `/api/chat/ws` (authenticated with the',
        'same cookie). Client → server: `{"type":"message","content":"hi"}`. Server → client:',
        '`{"type":"message","data":ChatMessage}`, `{"type":"presence","online":3}` or',
        '`{"type":"error","message":"..."}`.',
      ].join(' '),
      security: authenticated,
      parameters: queryParams(chatHistoryQuerySchema),
      responses: {
        200: json('Messages, oldest first', { type: 'array', items: ref('ChatMessage') }),
        401: errors[401],
      },
    },
  },
};
