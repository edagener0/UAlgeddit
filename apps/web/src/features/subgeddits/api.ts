import type { ListSubgedditsQuery, Paginated, SubgedditDto } from '@ualgeddit/shared';
import { api, toFormData } from '@/lib/api-client';

export interface SubgedditPayload {
  name?: string;
  description: string;
  icon?: File | null;
  banner?: File | null;
  removeIcon?: boolean;
  removeBanner?: boolean;
}

export const subgedditsApi = {
  list: (query: Partial<ListSubgedditsQuery>) =>
    api.get<Paginated<SubgedditDto>>('/subgeddits', query),
  get: (name: string) => api.get<SubgedditDto>(`/subgeddits/${encodeURIComponent(name)}`),
  create: (payload: SubgedditPayload) =>
    api.post<SubgedditDto>('/subgeddits', toFormData({ ...payload })),
  update: (name: string, { name: _ignored, ...payload }: SubgedditPayload) =>
    api.patch<SubgedditDto>(`/subgeddits/${encodeURIComponent(name)}`, toFormData({ ...payload })),
  delete: (name: string) => api.delete(`/subgeddits/${encodeURIComponent(name)}`),
};
