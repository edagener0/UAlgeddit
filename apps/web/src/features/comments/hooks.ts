import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentDto, CommentSort, VoteValue } from '@ualgeddit/shared';
import { patchPostInCache } from '../posts/hooks';
import { commentsApi } from './api';

export const commentKeys = {
  forPost: (postId: number) => ['comments', postId] as const,
  list: (postId: number, sort: CommentSort) => ['comments', postId, sort] as const,
};

export function useComments(postId: number, sort: CommentSort) {
  return useQuery({
    queryKey: commentKeys.list(postId, sort),
    queryFn: () => commentsApi.list(postId, sort),
  });
}

/** Recursively updates one comment inside a cached tree. */
function patchTree(
  tree: CommentDto[],
  id: number,
  patch: (c: CommentDto) => CommentDto,
): CommentDto[] {
  return tree.map((comment) =>
    comment.id === id
      ? patch(comment)
      : { ...comment, replies: patchTree(comment.replies, id, patch) },
  );
}

export function useCreateComment(postId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; parentId?: number; images: File[] }) =>
      commentsApi.create(postId, payload),
    onSuccess: () => {
      patchPostInCache(client, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));
      return client.invalidateQueries({ queryKey: commentKeys.forPost(postId) });
    },
  });
}

export function useDeleteComment(postId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.delete,
    onSuccess: () => {
      patchPostInCache(client, postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }));
      return client.invalidateQueries({ queryKey: commentKeys.forPost(postId) });
    },
  });
}

export function useVoteComment(postId: number, commentId: number) {
  const client = useQueryClient();
  const patch = (fn: (c: CommentDto) => CommentDto) =>
    client.setQueriesData<CommentDto[]>({ queryKey: commentKeys.forPost(postId) }, (tree) =>
      tree ? patchTree(tree, commentId, fn) : tree,
    );
  return useMutation({
    mutationFn: (value: VoteValue) => commentsApi.vote(commentId, value),
    onMutate: (value) => patch((c) => ({ ...c, myVote: value, score: c.score - c.myVote + value })),
    onSuccess: (result) => patch((c) => ({ ...c, ...result })),
    onError: () => client.invalidateQueries({ queryKey: commentKeys.forPost(postId) }),
  });
}
