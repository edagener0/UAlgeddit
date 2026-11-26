import type { AuthUser, UpdateProfileInput, UserProfile } from '@ualgeddit/shared';
import { api, toFormData } from '@/lib/api-client';

export const usersApi = {
  get: (username: string) => api.get<UserProfile>(`/users/${encodeURIComponent(username)}`),
  updateMe: (input: UpdateProfileInput) => api.patch<UserProfile>('/users/me', input),
  uploadAvatar: (file: File) => api.put<AuthUser>('/users/me/avatar', toFormData({ avatar: file })),
  removeAvatar: () => api.delete<AuthUser>('/users/me/avatar'),
};
