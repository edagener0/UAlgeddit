import { MAX_COMMENT_IMAGES } from '@ualgeddit/shared';
import { ImagePlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImagePicker } from '@/components/image-picker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { errorMessage } from '@/lib/api-client';
import { useCreateComment } from './hooks';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  autoFocus?: boolean;
  placeholder?: string;
  onDone?: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  postId,
  parentId,
  autoFocus,
  placeholder,
  onDone,
  onCancel,
}: CommentFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [showImages, setShowImages] = useState(false);
  const create = useCreateComment(postId);
  const trimmed = content.trim();
  const canSubmit = (trimmed.length > 0 || images.length > 0) && trimmed.length <= 10_000;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      { content: trimmed, parentId, images },
      {
        onSuccess: () => {
          setContent('');
          setImages([]);
          setShowImages(false);
          onDone?.();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-brand-500"
    >
      <Textarea
        aria-label={parentId ? t('comments.reply') : t('comments.comment')}
        value={content}
        autoFocus={autoFocus}
        placeholder={placeholder ?? t('comments.placeholder')}
        maxLength={10_000}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit(event);
        }}
        className="min-h-20 border-0 focus:ring-0"
      />
      {showImages && (
        <ImagePicker files={images} onChange={setImages} max={MAX_COMMENT_IMAGES} compact />
      )}
      <div className="flex items-center justify-between gap-2 px-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('comments.attach')}
          aria-pressed={showImages}
          onClick={() => setShowImages((value) => !value)}
        >
          <ImagePlus className="size-5" aria-hidden />
        </Button>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!canSubmit} loading={create.isPending}>
            {parentId ? t('comments.reply') : t('comments.comment')}
          </Button>
        </div>
      </div>
    </form>
  );
}
