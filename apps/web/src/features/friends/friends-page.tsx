import { usernameSchema } from '@ualgeddit/shared';
import { Check, UserPlus, X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Input } from '@/components/ui/field';
import { translateMessage } from '@/i18n';
import { errorMessage } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import type { UserSummary } from '@ualgeddit/shared';
import { useFriendAction, useFriendRequests, useFriends } from './hooks';

function UserRow({
  user,
  meta,
  children,
}: {
  user: UserSummary;
  meta: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={user.avatarUrl} name={user.username} />
        <span className="min-w-0">
          <span className="block truncate font-semibold hover:underline">{user.username}</span>
          <span className="block text-xs text-fg-muted">{meta}</span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );
}

function AddFriendForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useFriendAction('send');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setError(translateMessage(parsed.error.issues[0]?.message ?? 'Validation failed'));
      return;
    }
    setError(null);
    send.mutate(parsed.data, {
      onSuccess: (result) => {
        const { status } = result as { status: string };
        toast.success(
          status === 'friends'
            ? t('friends.nowFriends', { name: parsed.data })
            : t('friends.requestSent'),
        );
        setUsername('');
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <Input
          aria-label={t('auth.username')}
          placeholder={t('friends.addPlaceholder')}
          value={username}
          aria-invalid={error ? true : undefined}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Button type="submit" loading={send.isPending} className="h-11">
          <UserPlus className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('friends.send')}</span>
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

export function FriendsPage() {
  const { t } = useTranslation();
  const friends = useFriends();
  const requests = useFriendRequests();
  const accept = useFriendAction('accept');
  const decline = useFriendAction('decline');
  const cancel = useFriendAction('cancel');
  const unfriend = useFriendAction('unfriend');
  const onError = (error: unknown) => toast.error(errorMessage(error));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t('friends.title')}</h1>
      <Card className="p-4">
        <AddFriendForm />
      </Card>

      {requests.isPending ? (
        <Spinner />
      ) : requests.isError ? (
        <ErrorState error={requests.error} />
      ) : (
        <>
          {requests.data.received.length > 0 && (
            <section aria-labelledby="received-heading" className="space-y-2">
              <h2 id="received-heading" className="font-bold">
                {t('friends.requests')}{' '}
                <span className="ml-1 rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">
                  {requests.data.received.length}
                </span>
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {requests.data.received.map(({ from, createdAt }) => (
                    <UserRow
                      key={from.id}
                      user={from}
                      meta={t('friends.sentAgo', { time: formatRelativeTime(createdAt) })}
                    >
                      <Button size="sm" onClick={() => accept.mutate(from.id, { onError })}>
                        <Check className="size-4" aria-hidden />
                        {t('friends.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={t('friends.decline', { name: from.username })}
                        onClick={() => decline.mutate(from.id, { onError })}
                      >
                        <X className="size-4" aria-hidden />
                      </Button>
                    </UserRow>
                  ))}
                </ul>
              </Card>
            </section>
          )}
          {requests.data.sent.length > 0 && (
            <section aria-labelledby="sent-heading" className="space-y-2">
              <h2 id="sent-heading" className="font-bold">
                {t('friends.pending')}
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {requests.data.sent.map(({ to, createdAt }) => (
                    <UserRow
                      key={to.id}
                      user={to}
                      meta={t('friends.requestedAgo', { time: formatRelativeTime(createdAt) })}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancel.mutate(to.id, { onError })}
                      >
                        {t('common.cancel')}
                      </Button>
                    </UserRow>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="friends-heading" className="space-y-2">
        <h2 id="friends-heading" className="font-bold">
          {t('friends.all')}{' '}
          {friends.data && (
            <span className="font-normal text-fg-muted">({friends.data.length})</span>
          )}
        </h2>
        {friends.isPending ? (
          <Spinner />
        ) : friends.isError ? (
          <ErrorState error={friends.error} />
        ) : friends.data.length === 0 ? (
          <Card>
            <EmptyState title={t('friends.none')} description={t('friends.noneHint')} />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {friends.data.map((friend) => (
                <UserRow
                  key={friend.id}
                  user={friend}
                  meta={t('friends.since', { time: formatRelativeTime(friend.since) })}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => unfriend.mutate(friend.id, { onError })}
                  >
                    {t('friends.unfriend')}
                  </Button>
                </UserRow>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
