import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/card';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <Link
          to="/"
          className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-brand-500 text-2xl font-extrabold text-white"
        >
          g
        </Link>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <p className="mt-1 mb-6 text-center text-sm text-fg-muted">{subtitle}</p>
        {children}
        <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>
      </Card>
    </div>
  );
}
