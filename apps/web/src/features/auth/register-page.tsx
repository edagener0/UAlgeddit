import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@ualgeddit/shared';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { applyServerErrors } from '@/lib/form-errors';
import { AuthLayout } from './auth-layout';
import { useCurrentUser, useRegister } from './hooks';

export function RegisterPage() {
  const { user } = useCurrentUser();
  const registerUser = useRegister();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), mode: 'onTouched' });

  if (user && !registerUser.isSuccess) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit((values) =>
    registerUser.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome to UAlgeddit, ${user.username}!`);
        void navigate(from, { replace: true });
      },
      onError: (error) =>
        applyServerErrors(error, setError, ['username', 'password', 'confirmPassword']),
    }),
  );

  return (
    <AuthLayout
      title="Sign up"
      subtitle="Join the conversation in seconds"
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-brand-600 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label="Username"
          error={errors.username?.message}
          hint="3-20 letters, numbers, _ or -"
        >
          {(props) => (
            <Input autoComplete="username" autoFocus {...props} {...register('username')} />
          )}
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters with a letter and a number"
        >
          {(props) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...props}
              {...register('password')}
            />
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...props}
              {...register('confirmPassword')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
