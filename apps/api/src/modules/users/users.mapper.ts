import type { UserSummary } from '@ualgeddit/shared';

/** Prisma `select` for the public summary of a user embedded in other resources. */
export const userSummarySelect = { id: true, username: true, avatarUrl: true } as const;

export function toUserSummary(user: {
  id: number;
  username: string;
  avatarUrl: string | null;
}): UserSummary {
  return { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
}

/** Formats a `@db.Date` value as `YYYY-MM-DD`. */
export function toIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
