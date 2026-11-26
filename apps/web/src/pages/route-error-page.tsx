import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';

/** Rendered by the router when a page throws while rendering. */
export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unknown error';
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-fg-muted">{message}</p>
      <Link to="/" reloadDocument className={buttonClasses()}>
        Reload UAlgeddit
      </Link>
    </div>
  );
}
