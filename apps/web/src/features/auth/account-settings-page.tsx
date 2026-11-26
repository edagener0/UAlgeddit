import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@ualgeddit/shared';
import { KeyRound, TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input } from '@/components/ui/field';
import { translateMessage } from '@/i18n';
import { ApiError, errorMessage } from '@/lib/api-client';
import { applyServerErrors } from '@/lib/form-errors';
import { useChangePassword, useDeleteAccount } from './hooks';

function ChangePasswordCard() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: () => {
        reset();
        toast.success(t('settings.passwordChanged'));
      },
      onError: (error) =>
        applyServerErrors(error, setError, ['currentPassword', 'newPassword', 'confirmPassword']),
    }),
  );

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-brand-500" aria-hidden />
        <div>
          <h2 className="font-bold">{t('settings.passwordTitle')}</h2>
          <p className="text-sm text-fg-muted">{t('settings.passwordHint')}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t('settings.currentPassword')} error={errors.currentPassword?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              {...props}
              {...register('currentPassword')}
            />
          )}
        </Field>
        <Field
          label={t('settings.newPassword')}
          error={errors.newPassword?.message}
          hint={t('auth.passwordHint')}
        >
          {(props) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...props}
              {...register('newPassword')}
            />
          )}
        </Field>
        <Field label={t('settings.confirmPassword')} error={errors.confirmPassword?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...props}
              {...register('confirmPassword')}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={change.isPending}>
            {t('settings.passwordTitle')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DeleteAccountCard() {
  const { t } = useTranslation();
  const remove = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const askConfirmation = (event: FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError(translateMessage('Password is required'));
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const deleteAccount = () =>
    remove.mutate(
      { password },
      {
        onSuccess: () => toast.success(t('settings.deleted')),
        onError: (err) => {
          setConfirming(false);
          setError(
            err instanceof ApiError && err.details[0]?.path === 'password'
              ? translateMessage(err.details[0].message)
              : errorMessage(err),
          );
        },
      },
    );

  return (
    <Card className="space-y-4 border-red-500/40 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden />
        <div>
          <h2 className="font-bold text-red-600 dark:text-red-400">{t('settings.dangerTitle')}</h2>
          <p className="text-sm text-fg-muted">{t('settings.dangerText')}</p>
        </div>
      </div>
      <form onSubmit={askConfirmation} className="space-y-4" noValidate>
        <Field label={t('settings.confirmWithPassword')} error={error ?? undefined}>
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              {...props}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="danger">
            {t('settings.deleteButton')}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        title={t('settings.deleteConfirmTitle')}
        description={t('settings.dangerText')}
        confirmLabel={t('settings.deleteButton')}
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={deleteAccount}
      />
    </Card>
  );
}

export function AccountSettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
