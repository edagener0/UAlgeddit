import type { ImageDto } from '@ualgeddit/shared';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface LightboxProps {
  images: Pick<ImageDto, 'url'>[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const control = 'absolute rounded-full bg-white/10 p-2 text-white hover:bg-white/20';

/** Full-screen image viewer with keyboard navigation. */
export function Lightbox({ images, initialIndex, alt, onClose }: LightboxProps) {
  const { t } = useTranslation();
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
      aria-label={t('gallery.dialog', { alt, index: index + 1, count })}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label={t('gallery.close')}
        onClick={onClose}
        className={`${control} top-4 right-4`}
      >
        <X className="size-6" aria-hidden />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={t('gallery.previous')}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index - 1 + count) % count);
            }}
            className={`${control} left-3 sm:left-6`}
          >
            <ChevronLeft className="size-7" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t('gallery.next')}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index + 1) % count);
            }}
            className={`${control} right-3 sm:right-6`}
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
        alt={t('gallery.alt', { alt, index: index + 1, count })}
        className="max-h-[90dvh] max-w-[95vw] rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
