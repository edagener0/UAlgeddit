import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from '@ualgeddit/shared';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { accountApi, authApi } from './api';

export const meQueryKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  const query = useQuery({ queryKey: meQueryKey, queryFn: authApi.me, staleTime: 5 * 60_000 });
  return { user: query.data ?? null, isLoading: query.isPending };
}

function useOnAuthenticated() {
  const queryClient = useQueryClient();
  return (user: AuthUser) => {
    queryClient.setQueryData(meQueryKey, user);
    // Votes and friendship status depend on who is signed in.
    void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  };
}

export function useLogin() {
  const onAuthenticated = useOnAuthenticated();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => onAuthenticated(user),
  });
}

export function useRegister() {
  const onAuthenticated = useOnAuthenticated();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => onAuthenticated(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.setQueryData(meQueryKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      void navigate('/');
    },
  });
}

/**
 * Returns a guard that runs `action` when signed in, or sends the visitor to
 * the login page (coming back here afterwards).
 */
export function useRequireAuth() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (action: () => void) => {
      if (user) {
        action();
        return;
      }
      void navigate('/login', { state: { from: location.pathname + location.search } });
    },
    [user, navigate, location],
  );
}

export function useChangePassword() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: accountApi.changePassword,
    onSuccess: ({ user }) => client.setQueryData(meQueryKey, user),
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: accountApi.deleteAccount,
    onSuccess: () => {
      client.setQueryData(meQueryKey, null);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      void navigate('/', { replace: true });
    },
  });
}
