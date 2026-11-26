import type { VoteValue } from '@ualgeddit/shared';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn, formatCount } from '@/lib/utils';

interface VoteButtonsProps {
  score: number;
  myVote: -1 | 0 | 1;
  onVote: (value: VoteValue) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** `pill` fills the background when voted; `plain` only colours the arrows. */
  variant?: 'pill' | 'plain';
  className?: string;
}

/** Up/down vote pill. Clicking the active arrow again removes the vote. */
export function VoteButtons({
  score,
  myVote,
  onVote,
  disabled,
  size = 'md',
  variant = 'pill',
  className,
}: VoteButtonsProps) {
  const icon = size === 'sm' ? 'size-4' : 'size-5';
  const vote = (direction: 1 | -1) => onVote(myVote === direction ? 0 : direction);
  const filled = variant === 'pill' && myVote !== 0;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full',
        variant === 'pill' && myVote === 1 && 'bg-upvote text-white',
        variant === 'pill' && myVote === -1 && 'bg-downvote text-white',
        variant === 'pill' && myVote === 0 && 'bg-surface-muted',
        variant === 'plain' && myVote === 1 && 'text-upvote',
        variant === 'plain' && myVote === -1 && 'text-downvote',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        disabled={disabled}
        onClick={() => vote(1)}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          filled ? 'hover:bg-black/15' : 'hover:bg-line hover:text-upvote',
        )}
      >
        <ArrowBigUp className={cn(icon, myVote === 1 && 'fill-current')} aria-hidden />
      </button>
      <span
        aria-label={`Score ${score}`}
        className={cn(
          'min-w-6 text-center font-bold tabular-nums',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        {formatCount(score)}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        disabled={disabled}
        onClick={() => vote(-1)}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          filled ? 'hover:bg-black/15' : 'hover:bg-line hover:text-downvote',
        )}
      >
        <ArrowBigDown className={cn(icon, myVote === -1 && 'fill-current')} aria-hidden />
      </button>
    </div>
  );
}
