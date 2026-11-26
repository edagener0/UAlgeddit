import { zodResolver } from '@hookform/resolvers/zod';
import { updatePostSchema } from '@ualgeddit/shared';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { SubgedditIcon } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { errorMessage } from '@/lib/api-client';
import { NotFoundPage } from '@/pages/not-found-page';
import { ApiError } from '@/lib/api-client';
import { useCurrentUser } from '../auth/hooks';
import { CommentSection } from '../comments/comment-section';
import { PostCard } from './post-card';
import { PostSkeleton } from './post-feed';
import { useDeletePost, usePost, useUpdatePost } from './hooks';

const editSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  content: z.string().max(40_000),
});
type EditValues = z.infer<typeof editSchema>;

function EditPostForm({
  id,
  initial,
  onDone,
}: {
  id: number;
  initial: EditValues;
  onDone: () => void;
}) {
  const update = useUpdatePost(id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: initial,
  });
  return (
    <Card className="p-4">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          update.mutate(updatePostSchema.parse(values), {
            onSuccess: () => {
              toast.success('Post updated');
              onDone();
            },
            onError: (error) => toast.error(errorMessage(error)),
          }),
        )}
      >
        <Field label="Title" error={errors.title?.message}>
          {(props) => <Input {...props} {...register('title')} />}
        </Field>
        <Field label="Body" error={errors.content?.message}>
          {(props) => <Textarea rows={8} {...props} {...register('content')} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function PostPage() {
  const id = Number(useParams().id);
  const post = usePost(id);
  const { user } = useCurrentUser();
  const remove = useDeletePost();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />;
  if (post.isError) {
    if (post.error instanceof ApiError && post.error.status === 404) return <NotFoundPage />;
    return <ErrorState error={post.error} onRetry={() => void post.refetch()} />;
  }

  const isAuthor = post.data && user?.id === post.data.author.id;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => void navigate(-1)}>
          <ArrowLeft className="size-5" aria-hidden />
        </Button>
        {post.data && (
          <Link
            to={`/g/${post.data.subgeddit.name}`}
            className="flex items-center gap-2 font-semibold hover:underline"
          >
            <SubgedditIcon
              src={post.data.subgeddit.iconUrl}
              name={post.data.subgeddit.name}
              size="sm"
            />
            g/{post.data.subgeddit.name}
          </Link>
        )}
        {isAuthor && !editing && (
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-red-600"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </div>
        )}
      </div>

      {post.isPending ? (
        <PostSkeleton />
      ) : editing ? (
        <EditPostForm
          id={id}
          initial={{ title: post.data.title, content: post.data.content }}
          onDone={() => setEditing(false)}
        />
      ) : (
        <PostCard post={post.data} detailed hideSubgeddit />
      )}

      {post.data && <CommentSection postId={id} />}

      <ConfirmDialog
        open={confirming}
        title="Delete post?"
        description="This permanently deletes the post, its images and all of its comments."
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              toast.success('Post deleted');
              void navigate(post.data ? `/g/${post.data.subgeddit.name}` : '/', { replace: true });
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </div>
  );
}
