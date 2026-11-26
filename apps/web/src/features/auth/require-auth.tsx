import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/components/ui/feedback';
import { useCurrentUser } from './hooks';

/** Route element that only renders its children for signed-in users. */
export function RequireAuth() {
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();
  if (isLoading) return <Spinner />;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
