import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';

/** Rendered by the router when a page throws while rendering. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : t('common.somethingWrong');
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{t('common.somethingWrong')}</h1>
      <p className="max-w-md text-sm text-fg-muted">{message}</p>
      <Link to="/" reloadDocument className={buttonClasses()}>
        {t('errors.reload')}
      </Link>
    </div>
  );
}
