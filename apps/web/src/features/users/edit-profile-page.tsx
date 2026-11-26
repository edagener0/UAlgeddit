import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@ualgeddit/shared';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { SingleImagePicker } from '@/components/image-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { errorMessage } from '@/lib/api-client';
import { applyServerErrors } from '@/lib/form-errors';
import { useCurrentUser } from '../auth/hooks';
import { useAvatar, useUpdateProfile, useUserProfile } from './hooks';

/** HTML date inputs produce "" when empty; the API expects null. */
const formSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters'),
  birthday: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

function EditProfileForm({
  username,
  bio,
  birthday,
}: {
  username: string;
  bio: string;
  birthday: string;
}) {
  const update = useUpdateProfile();
  const avatar = useAvatar();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { bio, birthday } });

  const onSubmit = handleSubmit((values) => {
    const parsed = updateProfileSchema.safeParse({
      bio: values.bio.trim() || null,
      birthday: values.birthday || null,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path[0] as keyof FormValues, { message: issue.message });
      }
      return;
    }
    update.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Profile updated');
        void navigate(`/u/${username}`);
      },
      onError: (error) => applyServerErrors(error, setError, ['bio', 'birthday']),
    });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <Card className="space-y-6 p-4 sm:p-6">
        <SingleImagePicker
          label="Avatar"
          shape="circle"
          file={null}
          currentUrl={user?.avatarUrl ?? null}
          onChange={(file) =>
            avatar.mutate(file, {
              onSuccess: () => toast.success(file ? 'Avatar updated' : 'Avatar removed'),
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
          onRemove={() => avatar.mutate(null)}
        />
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field
            label="Bio"
            error={errors.bio?.message}
            hint="Tell the community a bit about yourself."
          >
            {(props) => <Textarea rows={4} maxLength={500} {...props} {...register('bio')} />}
          </Field>
          <Field label="Birthday" error={errors.birthday?.message}>
            {(props) => (
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className="sm:w-56"
                {...props}
                {...register('birthday')}
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function EditProfilePage() {
  const { user } = useCurrentUser();
  const profile = useUserProfile(user?.username ?? '');
  if (profile.isPending) return <Spinner />;
  if (profile.isError) return <ErrorState error={profile.error} />;
  return (
    <EditProfileForm
      username={profile.data.username}
      bio={profile.data.bio ?? ''}
      birthday={profile.data.birthday ?? ''}
    />
  );
}
