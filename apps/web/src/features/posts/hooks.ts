import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import type { Paginated, PostDto, UpdatePostInput, VoteValue } from '@ualgeddit/shared';
import { postsApi, type PostFilters } from './api';

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  detail: (id: number) => [...postKeys.all, 'detail', id] as const,
};

export function usePostFeed(filters: PostFilters) {
  return useInfiniteQuery({
    queryKey: postKeys.list(filters),
    queryFn: ({ pageParam }) => postsApi.list({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function usePost(id: number) {
  return useQuery({ queryKey: postKeys.detail(id), queryFn: () => postsApi.get(id) });
}

/** Applies `patch` to the post everywhere it is cached (detail + every feed page). */
export function patchPostInCache(
  client: QueryClient,
  id: number,
  patch: (post: PostDto) => PostDto,
) {
  client.setQueryData<PostDto>(postKeys.detail(id), (post) => post && patch(post));
  client.setQueriesData<InfiniteData<Paginated<PostDto>>>({ queryKey: postKeys.lists() }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((post) => (post.id === id ? patch(post) : post)),
          })),
        }
      : data,
  );
}

export function useVotePost(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: VoteValue) => postsApi.vote(id, value),
    onMutate: (value) =>
      patchPostInCache(client, id, (post) => ({
        ...post,
        myVote: value,
        score: post.score - post.myVote + value,
      })),
    onSuccess: (result) => patchPostInCache(client, id, (post) => ({ ...post, ...result })),
    onError: () => client.invalidateQueries({ queryKey: postKeys.all }),
  });
}

export function useCreatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: postsApi.create,
    onSuccess: (post) => {
      client.setQueryData(postKeys.detail(post.id), post);
      void client.invalidateQueries({ queryKey: postKeys.lists() });
      void client.invalidateQueries({ queryKey: ['subgeddits'] });
    },
  });
}

export function useUpdatePost(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePostInput) => postsApi.update(id, input),
    onSuccess: (post) => patchPostInCache(client, id, () => post),
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: postsApi.delete,
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: postKeys.detail(id) });
      void client.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
