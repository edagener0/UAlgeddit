import { useQuery } from '@tanstack/react-query';
import type { ChatClientEvent, ChatMessageDto, ChatServerEvent } from '@ualgeddit/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api-client';

export type ChatStatus = 'connecting' | 'open' | 'closed';

const SESSION_EXPIRED = 4401;

function socketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/chat/ws`;
}

/**
 * Global chat: loads the recent history over REST, then streams new messages over
 * a WebSocket (authenticated by the session cookie) with exponential back-off.
 */
export function useChat() {
  const history = useQuery({
    queryKey: ['chat', 'history'],
    queryFn: () => api.get<ChatMessageDto[]>('/chat/messages', { limit: 50 }),
    staleTime: Infinity,
  });
  const [live, setLive] = useState<ChatMessageDto[]>([]);
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const [online, setOnline] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      setStatus('connecting');
      const ws = new WebSocket(socketUrl());
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setStatus('open');
      };
      ws.onmessage = (event: MessageEvent<string>) => {
        const data = JSON.parse(event.data) as ChatServerEvent;
        if (data.type === 'message') setLive((messages) => [...messages, data.data].slice(-500));
        if (data.type === 'presence') setOnline(data.online);
        if (data.type === 'error') setLastError(data.message);
      };
      ws.onclose = (event) => {
        setStatus('closed');
        // 4401: the session was revoked or expired; reconnecting would only fail.
        if (disposed || event.code === SESSION_EXPIRED) return;
        attempt += 1;
        timer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15_000));
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      socket.current?.close();
    };
  }, []);

  const messages = useMemo(() => {
    const seen = new Set<number>();
    return [...(history.data ?? []), ...live].filter((message) => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    });
  }, [history.data, live]);

  const send = useCallback((content: string) => {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const event: ChatClientEvent = { type: 'message', content };
    ws.send(JSON.stringify(event));
    setLastError(null);
    return true;
  }, []);

  return { messages, status, online, send, lastError, isLoading: history.isPending };
}
