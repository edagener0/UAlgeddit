import type { CommentDto } from '@ualgeddit/shared';
import { MAX_COMMENT_DEPTH } from '@ualgeddit/shared';
import { MessageSquare, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ImageThumbnails } from '@/components/image-gallery';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { VoteButtons } from '@/components/vote-buttons';
import { errorMessage } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { useCurrentUser, useRequireAuth } from '../auth/hooks';
import { CommentForm } from './comment-form';
import { useDeleteComment, useVoteComment } from './hooks';

function countReplies(comment: CommentDto): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

export function CommentItem({ comment, depth = 0 }: { comment: CommentDto; depth?: number }) {
  const { user } = useCurrentUser();
  const requireAuth = useRequireAuth();
  const vote = useVoteComment(comment.postId, comment.id);
  const remove = useDeleteComment(comment.postId);
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isAuthor = user !== null && comment.author?.id === user.id;

  return (
    <li className="relative">
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          {comment.author ? (
            <Link to={`/u/${comment.author.username}`} aria-label={`u/${comment.author.username}`}>
              <Avatar src={comment.author.avatarUrl} name={comment.author.username} size="sm" />
            </Link>
          ) : (
            <span className="size-8 rounded-full bg-surface-muted" aria-hidden />
          )}
          {!collapsed && comment.replies.length > 0 && (
            <button
              type="button"
              aria-label="Collapse thread"
              onClick={() => setCollapsed(true)}
              className="group mt-1 flex w-4 flex-1 justify-center"
            >
              <span className="w-0.5 rounded-full bg-line transition-colors group-hover:bg-brand-500" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-3">
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
            {comment.author ? (
              <Link to={`/u/${comment.author.username}`} className="font-semibold hover:underline">
                {comment.author.username}
              </Link>
            ) : (
              <span className="font-semibold text-fg-muted">[deleted]</span>
            )}
            <span className="text-fg-muted" aria-hidden>
              •
            </span>
            <time className="text-fg-muted" dateTime={comment.createdAt}>
              {formatRelativeTime(comment.createdAt)}
            </time>
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="ml-1 inline-flex items-center gap-1 font-semibold text-brand-600"
              >
                <PlusCircle className="size-3.5" aria-hidden />
                {countReplies(comment)} more
              </button>
            )}
          </div>

          {!collapsed && (
            <>
              {comment.deleted ? (
                <p className="mt-1 text-sm text-fg-muted italic">[deleted]</p>
              ) : (
                <>
                  {comment.content && (
                    <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-line">
                      {comment.content}
                    </p>
                  )}
                  <ImageThumbnails
                    images={comment.images}
                    alt={`Comment by ${comment.author?.username ?? 'user'}`}
                  />
                </>
              )}

              {!comment.deleted && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-fg-muted">
                  <VoteButtons
                    size="sm"
                    score={comment.score}
                    myVote={comment.myVote}
                    disabled={vote.isPending}
                    onVote={(value) => requireAuth(() => vote.mutate(value))}
                    variant="plain"
                  />
                  {depth < MAX_COMMENT_DEPTH && (
                    <button
                      type="button"
                      onClick={() => requireAuth(() => setReplying((value) => !value))}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-surface-muted hover:text-fg"
                    >
                      <MessageSquare className="size-3.5" aria-hidden />
                      Reply
                    </button>
                  )}
                  {comment.replies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCollapsed(true)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-surface-muted hover:text-fg"
                    >
                      <MinusCircle className="size-3.5" aria-hidden />
                      Collapse
                    </button>
                  )}
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              )}

              {replying && (
                <div className="mt-2">
                  <CommentForm
                    postId={comment.postId}
                    parentId={comment.id}
                    autoFocus
                    placeholder={`Reply to ${comment.author?.username ?? 'comment'}...`}
                    onDone={() => setReplying(false)}
                    onCancel={() => setReplying(false)}
                  />
                </div>
              )}

              {comment.replies.length > 0 && (
                <ul className="mt-3">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete comment?"
        description="Your comment will be removed. Replies will stay visible."
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(comment.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success('Comment deleted');
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </li>
  );
}
