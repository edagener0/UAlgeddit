import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/button-classes';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-sm text-fg-muted">
        The page you are looking for doesn&apos;t exist or has been removed.
      </p>
      <Link to="/" className={buttonClasses()}>
        Back to home
      </Link>
    </div>
  );
}
