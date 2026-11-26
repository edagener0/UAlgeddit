import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@ualgeddit/shared';
import { meQueryKey } from '../auth/hooks';
import { postKeys } from '../posts/hooks';
import { usersApi } from './api';

export const userKeys = {
  detail: (username: string) => ['users', username.toLowerCase()] as const,
};

export function useUserProfile(username: string) {
  return useQuery({ queryKey: userKeys.detail(username), queryFn: () => usersApi.get(username) });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => usersApi.updateMe(input),
    onSuccess: (profile) => client.setQueryData(userKeys.detail(profile.username), profile),
  });
}

export function useAvatar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File | null) =>
      file ? usersApi.uploadAvatar(file) : usersApi.removeAvatar(),
    onSuccess: (user) => {
      client.setQueryData(meQueryKey, user);
      void client.invalidateQueries({ queryKey: userKeys.detail(user.username) });
      void client.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
