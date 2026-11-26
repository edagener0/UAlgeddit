import type {
  ListPostsQuery,
  Paginated,
  PostDto,
  UpdatePostInput,
  VoteValue,
} from '@ualgeddit/shared';
import { api, toFormData } from '@/lib/api-client';

export type PostFilters = Partial<Omit<ListPostsQuery, 'page'>>;

export interface CreatePostPayload {
  subgedditId: number;
  title: string;
  content: string;
  images: File[];
}

export const postsApi = {
  list: (filters: PostFilters & { page: number }) => api.get<Paginated<PostDto>>('/posts', filters),
  get: (id: number) => api.get<PostDto>(`/posts/${id}`),
  create: ({ images, ...fields }: CreatePostPayload) =>
    api.post<PostDto>('/posts', toFormData({ ...fields, images })),
  update: (id: number, input: UpdatePostInput) => api.patch<PostDto>(`/posts/${id}`, input),
  delete: (id: number) => api.delete(`/posts/${id}`),
  vote: (id: number, value: VoteValue) =>
    api.put<{ score: number; myVote: VoteValue }>(`/posts/${id}/vote`, { value }),
};
