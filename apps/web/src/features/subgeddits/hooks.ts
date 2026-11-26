import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListSubgedditsQuery } from '@ualgeddit/shared';
import { postKeys } from '../posts/hooks';
import { subgedditsApi, type SubgedditPayload } from './api';

export const subgedditKeys = {
  all: ['subgeddits'] as const,
  list: (query: Partial<ListSubgedditsQuery>) => [...subgedditKeys.all, 'list', query] as const,
  detail: (name: string) => [...subgedditKeys.all, 'detail', name.toLowerCase()] as const,
};

export function useSubgeddits(query: Partial<ListSubgedditsQuery> = {}) {
  return useQuery({
    queryKey: subgedditKeys.list(query),
    queryFn: () => subgedditsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useSubgeddit(name: string) {
  return useQuery({ queryKey: subgedditKeys.detail(name), queryFn: () => subgedditsApi.get(name) });
}

export function useCreateSubgeddit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: subgedditsApi.create,
    onSuccess: (subgeddit) => {
      client.setQueryData(subgedditKeys.detail(subgeddit.name), subgeddit);
      void client.invalidateQueries({ queryKey: subgedditKeys.all });
    },
  });
}

export function useUpdateSubgeddit(name: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubgedditPayload) => subgedditsApi.update(name, payload),
    onSuccess: (subgeddit) => {
      client.setQueryData(subgedditKeys.detail(name), subgeddit);
      void client.invalidateQueries({ queryKey: subgedditKeys.all });
      void client.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useDeleteSubgeddit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: subgedditsApi.delete,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: subgedditKeys.all });
      void client.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
