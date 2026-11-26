import { zodResolver } from '@hookform/resolvers/zod';
import { createSubgedditSchema, subgedditNameSchema } from '@ualgeddit/shared';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { SingleImagePicker } from '@/components/image-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { applyServerErrors } from '@/lib/form-errors';
import { useCurrentUser } from '../auth/hooks';
import { useCreateSubgeddit, useSubgeddit, useUpdateSubgeddit } from './hooks';
import type { SubgedditDto } from '@ualgeddit/shared';

const formSchema = z.object({
  name: subgedditNameSchema,
  description: createSubgedditSchema.shape.description,
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

function SubgedditForm({ existing }: { existing?: SubgedditDto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateSubgeddit();
  const update = useUpdateSubgeddit(existing?.name ?? '');
  const [icon, setIcon] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: existing?.name ?? '', description: existing?.description ?? '' },
  });

  const name = useWatch({ control, name: 'name' });
  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: (subgeddit: SubgedditDto) => {
        toast.success(
          existing
            ? t('communities.updated')
            : t('communities.createdToast', { name: subgeddit.name }),
        );
        void navigate(`/g/${subgeddit.name}`);
      },
      onError: (error: unknown) => applyServerErrors(error, setError, ['name', 'description']),
    };
    if (existing) {
      update.mutate(
        {
          description: values.description,
          icon,
          banner,
          removeIcon: removeIcon && !icon,
          removeBanner: removeBanner && !banner,
        },
        options,
      );
    } else {
      create.mutate({ name: values.name, description: values.description, icon, banner }, options);
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">
        {existing
          ? t('communities.editTitle', { name: existing.name })
          : t('communities.createTitle')}
      </h1>
      <Card className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field
            label={t('communities.name')}
            error={errors.name?.message}
            hint={
              existing
                ? t('communities.nameLocked')
                : t('communities.nameHint', { name: name || t('communities.namePlaceholder') })
            }
          >
            {(props) => (
              <Input
                disabled={Boolean(existing)}
                placeholder="typescript"
                {...props}
                {...register('name')}
              />
            )}
          </Field>
          <Field label={t('communities.description')} error={errors.description?.message}>
            {(props) => (
              <Textarea
                rows={4}
                placeholder={t('communities.descriptionPlaceholder')}
                {...props}
                {...register('description')}
              />
            )}
          </Field>
          <SingleImagePicker
            label={t('communities.icon')}
            shape="circle"
            file={icon}
            currentUrl={removeIcon ? null : (existing?.iconUrl ?? null)}
            onChange={setIcon}
            onRemove={() => setRemoveIcon(true)}
          />
          <div className="space-y-1.5">
            <span className="block text-sm font-medium">{t('communities.banner')}</span>
            <SingleImagePicker
              label={t('communities.banner')}
              shape="banner"
              file={banner}
              currentUrl={removeBanner ? null : (existing?.bannerUrl ?? null)}
              onChange={setBanner}
              onRemove={() => setRemoveBanner(true)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => void navigate(-1)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={pending}>
              {existing ? t('communities.saveChanges') : t('common.createCommunity')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function CreateSubgedditPage() {
  return <SubgedditForm />;
}

export function EditSubgedditPage() {
  const name = useParams().name ?? '';
  const subgeddit = useSubgeddit(name);
  const { user } = useCurrentUser();
  if (subgeddit.isPending) return <Spinner />;
  if (subgeddit.isError) return <ErrorState error={subgeddit.error} />;
  if (subgeddit.data.owner.id !== user?.id) return <Navigate to={`/g/${name}`} replace />;
  return <SubgedditForm existing={subgeddit.data} />;
}
