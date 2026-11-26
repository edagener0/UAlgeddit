import type { FriendDto, FriendRequestDto, FriendshipStatus, UserSummary } from '@ualgeddit/shared';
import { api } from '@/lib/api-client';

export interface FriendRequests {
  received: FriendRequestDto[];
  sent: { to: UserSummary; createdAt: string }[];
}

export const friendsApi = {
  list: () => api.get<FriendDto[]>('/friends'),
  requests: () => api.get<FriendRequests>('/friends/requests'),
  send: (username: string) =>
    api.post<{ status: FriendshipStatus }>('/friends/requests', { username }),
  accept: (userId: number) => api.post<void>(`/friends/requests/${userId}/accept`),
  decline: (userId: number) => api.delete(`/friends/requests/received/${userId}`),
  cancel: (userId: number) => api.delete(`/friends/requests/sent/${userId}`),
  unfriend: (userId: number) => api.delete(`/friends/${userId}`),
};
