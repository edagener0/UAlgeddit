import type { ImageDto } from '@ualgeddit/shared';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: Pick<ImageDto, 'url'>[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

/** Full-screen image viewer with keyboard navigation. */
export function Lightbox({ images, initialIndex, alt, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % count);
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + count) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [count, onClose]);

  const image = images[index];
  if (!image) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} - image ${index + 1} of ${count}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="size-6" aria-hidden />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index - 1 + count) % count);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="size-7" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index + 1) % count);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="size-7" aria-hidden />
          </button>
          <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {index + 1} / {count}
          </span>
        </>
      )}
      <img
        src={image.url}
        alt={`${alt} (${index + 1} of ${count})`}
        className="max-h-[90dvh] max-w-[95vw] rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
