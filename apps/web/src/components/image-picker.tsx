import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { useObjectUrls } from '@/hooks/use-object-urls';
import { IMAGE_ACCEPT, validateImage } from '@/lib/image-validation';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  max: number;
  compact?: boolean;
}

/** Drag & drop multi-image picker with previews, reordering and client-side validation. */
export function ImagePicker({ files, onChange, max, compact = false }: ImagePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const previews = useObjectUrls(files);

  const add = (incoming: File[]) => {
    const problems = incoming.map(validateImage).filter(Boolean);
    const valid = incoming.filter((file) => validateImage(file) === null);
    const room = max - files.length;
    if (valid.length > room) problems.push(`You can attach at most ${max} images`);
    setError(problems[0] ?? null);
    if (room > 0 && valid.length > 0) onChange([...files, ...valid.slice(0, room)]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    add([...event.dataTransfer.files]);
  };

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={max > 1}
        hidden
        data-testid="image-input"
        onChange={(event) => {
          add([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />

      {files.length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-fg-muted transition-colors hover:border-brand-500 hover:text-fg',
            compact ? 'py-3 text-xs' : 'py-8 text-sm',
            dragging ? 'border-brand-500 bg-brand-500/5' : 'border-line',
          )}
        >
          <ImagePlus className={compact ? 'size-5' : 'size-7'} aria-hidden />
          <span>
            <strong className="text-fg">Click to upload</strong> or drag and drop
          </span>
          <span className="text-xs">
            JPEG, PNG, GIF or WebP · up to 5 MB · {files.length}/{max}
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-line"
            >
              <img src={previews[index]} alt={file.name} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
              >
                <X className="size-3.5" aria-hidden />
              </button>
              {files.length > 1 && (
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Move left"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    className="rounded-full bg-black/70 p-1 text-white disabled:invisible"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Move right"
                    disabled={index === files.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="rounded-full bg-black/70 p-1 text-white disabled:invisible"
                  >
                    <ChevronRight className="size-3.5" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Single image picker with a preview (avatars, icons, banners). */
export function SingleImagePicker({
  file,
  currentUrl,
  onChange,
  onRemove,
  label,
  shape = 'square',
}: {
  file: File | null;
  currentUrl: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  label: string;
  shape?: 'square' | 'circle' | 'banner';
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview] = useObjectUrls(file ? [file] : []);
  const shown = preview ?? currentUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label={`Choose ${label}`}
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-line bg-surface-muted text-fg-muted hover:border-brand-500',
            shape === 'circle' && 'size-20 rounded-full',
            shape === 'square' && 'size-20 rounded-2xl',
            shape === 'banner' && 'h-24 w-full rounded-xl',
          )}
        >
          {shown ? (
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6" aria-hidden />
          )}
        </button>
        {shape !== 'banner' && (
          <div className="text-xs text-fg-muted">
            <p className="text-sm font-medium text-fg">{label}</p>
            JPEG, PNG, GIF or WebP, up to 5 MB
          </div>
        )}
      </div>
      <div className="flex gap-3 text-sm">
        <button
          type="button"
          className="font-semibold text-brand-600 hover:underline"
          onClick={() => input.current?.click()}
        >
          {shown ? 'Change' : 'Upload'} {label.toLowerCase()}
        </button>
        {shown && (
          <button
            type="button"
            className="text-fg-muted hover:text-fg hover:underline"
            onClick={() => {
              onChange(null);
              if (!file) onRemove?.();
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          const next = event.target.files?.[0];
          event.target.value = '';
          if (!next) return;
          const problem = validateImage(next);
          setError(problem);
          if (!problem) onChange(next);
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
