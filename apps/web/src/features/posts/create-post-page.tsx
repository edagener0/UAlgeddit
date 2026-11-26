import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, MAX_POST_IMAGES } from '@ualgeddit/shared';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ImagePicker } from '@/components/image-picker';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-classes';
import { Card } from '@/components/ui/card';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { applyServerErrors } from '@/lib/form-errors';
import { useSubgeddits } from '../subgeddits/hooks';
import { useCreatePost } from './hooks';

type FormInput = z.input<typeof createPostSchema>;
type FormOutput = z.output<typeof createPostSchema>;

export function CreatePostPage() {
  const [params] = useSearchParams();
  const communities = useSubgeddits({ pageSize: 100 });
  const create = useCreatePost();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);

  const preselected = communities.data?.items.find(
    (s) => s.name.toLowerCase() === params.get('g')?.toLowerCase(),
  );

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createPostSchema),
    values: { subgedditId: preselected?.id ?? '', title: '', content: '' } as FormInput,
    resetOptions: { keepDirtyValues: true },
  });

  const title = useWatch({ control, name: 'title' }) ?? '';

  if (communities.isPending) return <Spinner />;
  if (communities.data?.items.length === 0) {
    return (
      <EmptyState
        title="No communities yet"
        description="Create a community first, then share your first post in it."
        action={
          <Link to="/g/new" className={buttonClasses()}>
            Create community
          </Link>
        }
      />
    );
  }

  const onSubmit = handleSubmit((values) =>
    create.mutate(
      { ...values, images },
      {
        onSuccess: (post) => {
          toast.success('Post published');
          void navigate(`/posts/${post.id}`);
        },
        onError: (error) => applyServerErrors(error, setError, ['title', 'content', 'subgedditId']),
      },
    ),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Create a post</h1>
      <Card className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Community" error={errors.subgedditId?.message}>
            {(props) => (
              <select
                {...props}
                {...register('subgedditId')}
                className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none sm:w-80"
              >
                <option value="">Choose a community</option>
                {communities.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    g/{s.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Title" error={errors.title?.message} hint={`${title.length}/300`}>
            {(props) => (
              <Input
                maxLength={300}
                placeholder="An interesting title"
                {...props}
                {...register('title')}
              />
            )}
          </Field>
          <div className="space-y-1.5">
            <span className="block text-sm font-medium">Images</span>
            <ImagePicker files={images} onChange={setImages} max={MAX_POST_IMAGES} />
          </div>
          <Field label="Body (optional)" error={errors.content?.message}>
            {(props) => (
              <Textarea
                rows={8}
                placeholder="Text (optional)"
                {...props}
                {...register('content')}
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Post
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
