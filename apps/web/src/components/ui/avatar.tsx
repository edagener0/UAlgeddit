import { cn } from '@/lib/utils';

const sizes = {
  xs: 'size-5 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
};

/** Deterministic hue so users without an avatar keep the same colour. */
function hueFor(text: string) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const classes = cn('shrink-0 rounded-full object-cover', sizes[size], className);
  if (src) return <img src={src} alt="" className={classes} loading="lazy" />;
  return (
    <span
      aria-hidden
      className={cn(classes, 'inline-flex items-center justify-center font-bold text-white')}
      style={{ background: `hsl(${hueFor(name)} 65% 50%)` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SubgedditIcon({
  src,
  name,
  size = 'md',
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const classes = cn('shrink-0 rounded-full object-cover', sizes[size], className);
  if (src) return <img src={src} alt="" className={classes} loading="lazy" />;
  return (
    <span
      aria-hidden
      className={cn(
        classes,
        'inline-flex items-center justify-center bg-brand-500 font-extrabold text-white',
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
