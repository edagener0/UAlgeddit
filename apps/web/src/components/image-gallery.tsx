import type { ImageDto } from '@ualgeddit/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Lightbox } from './lightbox';

interface ImageGalleryProps {
  images: ImageDto[];
  alt: string;
  className?: string;
}

/** Reddit-style carousel: blurred backdrop, arrows, dots and a counter. Click to enlarge. */
export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;
  const image = images[index];
  if (!image) return null;

  const go = (delta: number) => setIndex((value) => (value + delta + count) % count);

  return (
    <div
      className={cn('group relative overflow-hidden rounded-xl bg-surface-muted', className)}
      aria-roledescription="carousel"
      aria-label={`${alt} gallery`}
    >
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
        style={{ backgroundImage: `url("${image.url}")` }}
      />
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="relative block w-full cursor-zoom-in"
        aria-label={`Open image ${index + 1} of ${count} in full screen`}
      >
        <img
          src={image.url}
          alt={`${alt} (${index + 1} of ${count})`}
          loading="lazy"
          className="mx-auto max-h-[min(70vh,540px)] w-auto object-contain"
        />
      </button>

      {count > 1 && (
        <>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
            {index + 1}/{count}
          </span>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-black/80 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-black/80 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show image ${dot + 1}`}
                aria-current={dot === index}
                onClick={() => setIndex(dot)}
                className={cn(
                  'size-2 rounded-full transition-all',
                  dot === index ? 'w-4 bg-white' : 'bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}

      {lightbox && (
        <Lightbox
          images={images}
          initialIndex={index}
          alt={alt}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}

/** Compact thumbnail grid used inside comments. */
export function ImageThumbnails({ images, alt }: { images: ImageDto[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          onClick={() => setOpen(index)}
          aria-label={`Open image ${index + 1}`}
          className="overflow-hidden rounded-lg border border-line"
        >
          <img src={image.url} alt="" loading="lazy" className="size-28 object-cover sm:size-36" />
        </button>
      ))}
      {open !== null && (
        <Lightbox images={images} initialIndex={open} alt={alt} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
