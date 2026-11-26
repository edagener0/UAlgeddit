import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <div role="status" className={cn('flex justify-center py-10 text-fg-muted', className)}>
      <Loader2 className="size-6 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-muted', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon = <Inbox className="size-10" aria-hidden />,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-fg-muted">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="size-10 text-red-500" aria-hidden />}
      title="Something went wrong"
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
