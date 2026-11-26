import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@ualgeddit/shared';
import { api, ApiError } from '@/lib/api-client';

export const authApi = {
  /** Resolves to `null` when the visitor is not signed in. */
  me: async (): Promise<AuthUser | null> => {
    try {
      return await api.get<AuthUser>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input),
  register: (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input),
  logout: () => api.post<void>('/auth/logout'),
};
