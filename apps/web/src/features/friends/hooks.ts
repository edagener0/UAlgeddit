import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from './api';

export const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  requests: () => [...friendKeys.all, 'requests'] as const,
};

export function useFriends() {
  return useQuery({ queryKey: friendKeys.list(), queryFn: friendsApi.list });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: friendKeys.requests(),
    queryFn: friendsApi.requests,
    refetchInterval: 60_000,
  });
}

type Action = 'send' | 'accept' | 'decline' | 'cancel' | 'unfriend';

/** Every friendship mutation refreshes the friend lists and user profiles. */
export function useFriendAction<A extends Action>(action: A) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: friendsApi[action] as (arg: A extends 'send' ? string : number) => Promise<unknown>,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: friendKeys.all });
      void client.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
