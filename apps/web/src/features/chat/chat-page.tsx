import { chatMessageContentSchema } from '@ualgeddit/shared';
import { SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, Spinner } from '@/components/ui/feedback';
import { currentLocale, translateMessage } from '@/i18n';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '../auth/hooks';
import { useChat, type ChatStatus } from './use-chat';

const STATUS = {
  open: { label: 'chat.connected', dot: 'bg-emerald-500' },
  connecting: { label: 'chat.connecting', dot: 'bg-amber-500 animate-pulse' },
  closed: { label: 'chat.disconnected', dot: 'bg-red-500' },
} as const satisfies Record<ChatStatus, { label: string; dot: string }>;

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' });

export function ChatPage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { messages, status, online, send, lastError, isLoading } = useChat();
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = chatMessageContentSchema.safeParse(draft);
    if (parsed.success && send(parsed.data)) setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('chat.title')}</h1>
        <div className="flex items-center gap-3 text-sm text-fg-muted">
          <span>{t('chat.online', { count: online })}</span>
          <span className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', STATUS[status].dot)} aria-hidden />
            {t(STATUS[status].label)}
          </span>
        </div>
      </div>

      <Card className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4" aria-live="polite">
        {isLoading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <EmptyState title={t('chat.empty')} description={t('chat.emptyHint')} />
        ) : (
          <ol className="space-y-3">
            {messages.map((message, index) => {
              const mine = message.author.id === user?.id;
              const grouped = messages[index - 1]?.author.id === message.author.id;
              return (
                <li
                  key={message.id}
                  className={cn('flex gap-2', mine && 'flex-row-reverse', grouped && '-mt-2')}
                >
                  <Link
                    to={`/u/${message.author.username}`}
                    className={cn(grouped && 'invisible')}
                    tabIndex={grouped ? -1 : 0}
                  >
                    <Avatar
                      src={message.author.avatarUrl}
                      name={message.author.username}
                      size="sm"
                    />
                  </Link>
                  <div className={cn('max-w-[80%] space-y-0.5', mine && 'items-end text-right')}>
                    {!grouped && (
                      <div className="text-xs text-fg-muted">
                        <Link
                          to={`/u/${message.author.username}`}
                          className="font-semibold text-fg hover:underline"
                        >
                          {message.author.username}
                        </Link>{' '}
                        · {time(message.createdAt)}
                      </div>
                    )}
                    <p
                      className={cn(
                        'inline-block rounded-2xl px-3.5 py-2 text-left text-sm break-words whitespace-pre-wrap',
                        mine ? 'bg-brand-500 text-white' : 'bg-surface-muted',
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={bottom} />
      </Card>

      {lastError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {translateMessage(lastError)}
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <textarea
          aria-label={t('chat.message')}
          rows={1}
          value={draft}
          maxLength={1000}
          placeholder={status === 'open' ? t('chat.placeholder') : t('chat.waiting')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event);
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11"
          aria-label={t('chat.send')}
          disabled={status !== 'open' || !draft.trim()}
        >
          <SendHorizontal className="size-5" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
