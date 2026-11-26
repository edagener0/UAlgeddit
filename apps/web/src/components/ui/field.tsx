import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted ' +
  'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-red-500/20';

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({
  className,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(control, 'min-h-24 resize-y', className)} {...props} />;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: (props: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => ReactNode;
}

/** Label + control + hint/error, wiring up the accessibility attributes. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
