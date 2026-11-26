import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="text-2xl font-bold">{t('errors.notFoundTitle')}</h1>
      <p className="max-w-sm text-fg-muted">{t('errors.notFoundText')}</p>
      <Link to="/" className={buttonClasses()}>
        {t('errors.backHome')}
      </Link>
    </div>
  );
}
