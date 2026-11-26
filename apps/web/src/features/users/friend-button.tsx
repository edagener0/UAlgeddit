import type { UserProfile } from '@ualgeddit/shared';
import { Check, Clock, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';
import { useRequireAuth } from '../auth/hooks';
import { useFriendAction } from '../friends/hooks';

/** Context-aware friendship action for a profile. */
export function FriendButton({ profile }: { profile: UserProfile }) {
  const requireAuth = useRequireAuth();
  const send = useFriendAction('send');
  const accept = useFriendAction('accept');
  const cancel = useFriendAction('cancel');
  const unfriend = useFriendAction('unfriend');
  const onError = (error: unknown) => toast.error(errorMessage(error));

  switch (profile.friendshipStatus) {
    case 'self':
      return null;
    case 'friends':
      return (
        <Button
          variant="outline"
          loading={unfriend.isPending}
          onClick={() =>
            unfriend.mutate(profile.id, { onSuccess: () => toast('Removed from friends'), onError })
          }
        >
          <UserMinus className="size-4" aria-hidden />
          Unfriend
        </Button>
      );
    case 'request_sent':
      return (
        <Button
          variant="secondary"
          loading={cancel.isPending}
          onClick={() =>
            cancel.mutate(profile.id, { onSuccess: () => toast('Request cancelled'), onError })
          }
        >
          <Clock className="size-4" aria-hidden />
          Requested · Cancel
        </Button>
      );
    case 'request_received':
      return (
        <Button
          loading={accept.isPending}
          onClick={() =>
            accept.mutate(profile.id, {
              onSuccess: () => toast.success(`You and ${profile.username} are now friends`),
              onError,
            })
          }
        >
          <Check className="size-4" aria-hidden />
          Accept request
        </Button>
      );
    default:
      return (
        <Button
          loading={send.isPending}
          onClick={() =>
            requireAuth(() =>
              send.mutate(profile.username, {
                onSuccess: () => toast.success('Friend request sent'),
                onError,
              }),
            )
          }
        >
          <UserPlus className="size-4" aria-hidden />
          Add friend
        </Button>
      );
  }
}
