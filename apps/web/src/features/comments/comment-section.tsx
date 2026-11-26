import type { CommentSort } from '@ualgeddit/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import { useCurrentUser } from '../auth/hooks';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-thread';
import { useComments } from './hooks';

export function CommentSection({ postId }: { postId: number }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<CommentSort>('top');
  const comments = useComments(postId, sort);
  const { user } = useCurrentUser();
  const location = useLocation();
  const sorts: { value: CommentSort; label: string }[] = [
    { value: 'top', label: t('comments.top') },
    { value: 'new', label: t('comments.new') },
    { value: 'old', label: t('comments.old') },
  ];

  return (
    <section id="comments" aria-label={t('comments.label')} className="scroll-mt-20 space-y-4">
      {user ? (
        <CommentForm postId={postId} />
      ) : (
        <Card className="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
          <p className="text-sm text-fg-muted">{t('comments.joinPrompt')}</p>
          <div className="flex gap-2">
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className={buttonClasses('outline', 'sm')}
            >
              {t('common.logIn')}
            </Link>
            <Link
              to="/register"
              state={{ from: location.pathname }}
              className={buttonClasses('primary', 'sm')}
            >
              {t('common.signUp')}
            </Link>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">{t('comments.sortBy')}</span>
        <Segmented
          label={t('comments.sortLabel')}
          options={sorts}
          value={sort}
          onChange={setSort}
        />
      </div>

      {comments.isPending ? (
        <Spinner />
      ) : comments.isError ? (
        <ErrorState error={comments.error} onRetry={() => void comments.refetch()} />
      ) : comments.data.length === 0 ? (
        <EmptyState title={t('comments.empty')} description={t('comments.emptyHint')} />
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
