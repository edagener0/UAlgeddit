import type { VoteValue } from '@ualgeddit/shared';

/**
 * Score delta caused by changing a vote from `previous` to `next`.
 * e.g. upvote -> downvote = -2, downvote -> none = +1.
 */
export function voteDelta(previous: VoteValue, next: VoteValue): number {
  return next - previous;
}

/** Epoch used by the hot ranking (2025-01-01T00:00:00Z), keeps numbers small. */
const HOT_EPOCH_SECONDS = 1_735_689_600;

/**
 * Reddit's classic "hot" ranking: the order of magnitude of the score plus a
 * time component, so a post needs 10x the votes to beat one posted 12.5h later.
 */
export function hotRank(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = Math.sign(score);
  const seconds = createdAt.getTime() / 1000 - HOT_EPOCH_SECONDS;
  return Number((sign * order + seconds / 45_000).toFixed(7));
}
