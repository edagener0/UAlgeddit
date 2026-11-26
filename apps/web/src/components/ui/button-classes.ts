import { cn } from '@/lib/utils';

export const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
  secondary: 'bg-surface-muted text-fg hover:bg-line',
  outline: 'border border-line bg-transparent text-fg hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const;

export const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'size-9 justify-center',
} as const;

export function buttonClasses(
  variant: keyof typeof variants = 'primary',
  size: keyof typeof sizes = 'md',
  className?: string,
) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}
