import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@ualgeddit/shared';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { errorMessage } from '@/lib/api-client';
import { safeRedirect } from '@/lib/safe-redirect';
import { AuthLayout } from './auth-layout';
import { useCurrentUser, useLogin } from './hooks';

export function LoginPage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = safeRedirect((location.state as { from?: unknown } | null)?.from);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (user && !login.isSuccess) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(t('auth.welcomeBack', { name: user.username }));
        void navigate(from, { replace: true });
      },
      onError: (error) => toast.error(errorMessage(error)),
    }),
  );

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.newHere')}{' '}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-brand-600 hover:underline"
          >
            {t('auth.createAccount')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t('auth.username')} error={errors.username?.message}>
          {(props) => (
            <Input autoComplete="username" autoFocus {...props} {...register('username')} />
          )}
        </Field>
        <Field label={t('auth.password')} error={errors.password?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              {...props}
              {...register('password')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          {t('common.logIn')}
        </Button>
      </form>
    </AuthLayout>
  );
}
