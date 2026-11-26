import type { CommentSort } from '@ualgeddit/shared';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import { useCurrentUser } from '../auth/hooks';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-thread';
import { useComments } from './hooks';

const SORTS: { value: CommentSort; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
  { value: 'old', label: 'Old' },
];

export function CommentSection({ postId }: { postId: number }) {
  const [sort, setSort] = useState<CommentSort>('top');
  const comments = useComments(postId, sort);
  const { user } = useCurrentUser();
  const location = useLocation();

  return (
    <section id="comments" aria-label="Comments" className="scroll-mt-20 space-y-4">
      {user ? (
        <CommentForm postId={postId} />
      ) : (
        <Card className="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
          <p className="text-sm text-fg-muted">Log in or sign up to join the discussion.</p>
          <div className="flex gap-2">
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className={buttonClasses('outline', 'sm')}
            >
              Log in
            </Link>
            <Link
              to="/register"
              state={{ from: location.pathname }}
              className={buttonClasses('primary', 'sm')}
            >
              Sign up
            </Link>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">Sort by</span>
        <Segmented label="Sort comments" options={SORTS} value={sort} onChange={setSort} />
      </div>

      {comments.isPending ? (
        <Spinner />
      ) : comments.isError ? (
        <ErrorState error={comments.error} onRetry={() => void comments.refetch()} />
      ) : comments.data.length === 0 ? (
        <EmptyState title="No comments yet" description="Be the first to share what you think!" />
      ) : (
        <ul className="space-y-1">
          {comments.data.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
    </section>
  );
}
