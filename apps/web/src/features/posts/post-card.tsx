import type { PostDto } from '@ualgeddit/shared';
import { MessageSquare, Share2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ImageGallery } from '@/components/image-gallery';
import { Avatar, SubgedditIcon } from '@/components/ui/avatar';
import { VoteButtons } from '@/components/vote-buttons';
import { cn, formatCount, formatRelativeTime } from '@/lib/utils';
import { useRequireAuth } from '../auth/hooks';
import { useVotePost } from './hooks';

interface PostCardProps {
  post: PostDto;
  /** Full content and no navigation on click (post detail page). */
  detailed?: boolean;
  /** Hide the subgeddit name (already shown in the page header). */
  hideSubgeddit?: boolean;
}

export function PostMeta({ post, hideSubgeddit }: { post: PostDto; hideSubgeddit?: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-fg-muted">
      {!hideSubgeddit && (
        <>
          <Link
            to={`/g/${post.subgeddit.name}`}
            className="flex items-center gap-1.5 font-bold text-fg hover:underline"
          >
            <SubgedditIcon src={post.subgeddit.iconUrl} name={post.subgeddit.name} size="xs" />
            g/{post.subgeddit.name}
          </Link>
          <span aria-hidden>•</span>
        </>
      )}
      <Link to={`/u/${post.author.username}`} className="flex items-center gap-1 hover:underline">
        {hideSubgeddit && (
          <Avatar src={post.author.avatarUrl} name={post.author.username} size="xs" />
        )}
        u/{post.author.username}
      </Link>
      <span aria-hidden>•</span>
      <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>
        {formatRelativeTime(post.createdAt)}
      </time>
      {post.editedAt && (
        <span className="italic" title={`Edited ${new Date(post.editedAt).toLocaleString()}`}>
          (edited)
        </span>
      )}
    </div>
  );
}

export function PostCard({ post, detailed = false, hideSubgeddit = false }: PostCardProps) {
  const navigate = useNavigate();
  const vote = useVotePost(post.id);
  const requireAuth = useRequireAuth();
  const href = `/posts/${post.id}`;

  const share = async (event: MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}${href}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  // Make the whole card clickable without nesting interactive elements in a link.
  const openPost = (event: MouseEvent<HTMLElement>) => {
    if (detailed) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    void navigate(href);
  };

  return (
    <article
      onClick={openPost}
      className={cn(
        'rounded-2xl border border-line bg-surface p-3 transition-colors sm:p-4',
        !detailed && 'cursor-pointer hover:border-fg-muted/40',
      )}
    >
      <PostMeta post={post} hideSubgeddit={hideSubgeddit} />

      {detailed ? (
        <h1 className="mt-2 text-xl font-bold break-words sm:text-2xl">{post.title}</h1>
      ) : (
        <h2 className="mt-1.5 text-lg leading-snug font-semibold break-words">
          <Link to={href} className="hover:underline">
            {post.title}
          </Link>
        </h2>
      )}

      {post.images.length > 0 && (
        <ImageGallery images={post.images} alt={post.title} className="mt-3" />
      )}

      {post.content && (
        <p
          className={cn(
            'mt-3 text-sm leading-relaxed break-words whitespace-pre-line',
            !detailed && 'line-clamp-4 text-fg-muted',
          )}
        >
          {post.content}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VoteButtons
          score={post.score}
          myVote={post.myVote}
          disabled={vote.isPending}
          onVote={(value) => requireAuth(() => vote.mutate(value))}
        />
        <Link
          to={detailed ? '#comments' : `${href}#comments`}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold hover:bg-line"
        >
          <MessageSquare className="size-4" aria-hidden />
          {formatCount(post.commentCount)}
          <span className="sr-only">comments</span>
        </Link>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold hover:bg-line"
        >
          <Share2 className="size-4" aria-hidden />
          Share
        </button>
      </div>
    </article>
  );
}
