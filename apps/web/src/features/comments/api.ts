import type { CommentDto, CommentSort, VoteValue } from '@ualgeddit/shared';
import { api, toFormData } from '@/lib/api-client';

export const commentsApi = {
  list: (postId: number, sort: CommentSort) =>
    api.get<CommentDto[]>(`/posts/${postId}/comments`, { sort }),
  create: (postId: number, payload: { content: string; parentId?: number; images: File[] }) =>
    api.post<CommentDto>(`/posts/${postId}/comments`, toFormData(payload)),
  delete: (id: number) => api.delete(`/comments/${id}`),
  vote: (id: number, value: VoteValue) =>
    api.put<{ score: number; myVote: VoteValue }>(`/comments/${id}/vote`, { value }),
};
