import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { chatClientEventSchema, type ChatServerEvent } from '@ualgeddit/shared';
import type { Logger } from 'pino';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { extractToken, parseCookieHeader } from '../../common/http/auth-cookie.js';
import type { AuthenticatedUser } from '../../common/http/types.js';
import type { TokenAuthenticator } from '../../common/middleware/authenticate.js';
import { isAllowedOrigin } from '../../common/middleware/origin-check.js';
import type { ChatService } from './chat.service.js';

export const CHAT_WS_PATH = '/api/chat/ws';

const HEARTBEAT_MS = 30_000;
const RATE_WINDOW_MS = 5_000;
const RATE_MAX_MESSAGES = 5;
/** Simultaneous sockets per user (tabs/devices); more are refused. */
const MAX_CONNECTIONS_PER_USER = 5;
/** Close code sent when the session behind a socket is revoked or expires. */
const SESSION_EXPIRED = 4401;

interface Client {
  socket: WebSocket;
  user: AuthenticatedUser;
  /** Kept to re-validate the session periodically (logout revokes it). */
  token: string;
  alive: boolean;
  sentAt: number[];
}

/** Real-time global chat over WebSocket, authenticated with the same JWT as the REST API. */
export class ChatGateway {
  private readonly wss = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024 });
  private readonly clients = new Set<Client>();
  private heartbeat?: NodeJS.Timeout;

  constructor(
    private readonly chat: ChatService,
    private readonly authenticator: TokenAuthenticator,
    private readonly allowedOrigins: string[],
    private readonly logger: Logger,
  ) {}

  attach(server: Server): void {
    server.on('upgrade', (req, socket, head) => {
      void this.handleUpgrade(req, socket, head);
    });
    this.heartbeat = setInterval(() => this.checkHeartbeats(), HEARTBEAT_MS);
    this.heartbeat.unref();
  }

  close(): void {
    clearInterval(this.heartbeat);
    for (const client of this.clients) client.socket.close(1001, 'Server shutting down');
    this.wss.close();
  }

  private async handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== CHAT_WS_PATH) {
      socket.destroy();
      return;
    }

    const origin = req.headers.origin;
    if (origin && !isAllowedOrigin(origin, this.allowedOrigins, req.headers.host)) {
      this.reject(socket, 403, 'Forbidden');
      return;
    }

    const token = extractToken(parseCookieHeader(req.headers.cookie));
    const user = token ? await this.authenticator.authenticate(token).catch(() => null) : null;
    if (!user) {
      this.reject(socket, 401, 'Unauthorized');
      return;
    }

    const open = [...this.clients].filter((client) => client.user.id === user.id).length;
    if (open >= MAX_CONNECTIONS_PER_USER) {
      this.reject(socket, 429, 'Too Many Requests');
      return;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => this.onConnection(ws, user, token!));
  }

  private onConnection(socket: WebSocket, user: AuthenticatedUser, token: string) {
    const client: Client = { socket, user, token, alive: true, sentAt: [] };
    this.clients.add(client);
    this.broadcastPresence();

    socket.on('pong', () => {
      client.alive = true;
    });
    socket.on('message', (data) => {
      void this.onMessage(client, data);
    });
    socket.on('close', () => {
      this.clients.delete(client);
      this.broadcastPresence();
    });
    socket.on('error', (error) => this.logger.warn({ err: error }, 'Chat socket error'));
  }

  private async onMessage(client: Client, data: RawData) {
    const now = Date.now();
    client.sentAt = client.sentAt.filter((time) => now - time < RATE_WINDOW_MS);
    if (client.sentAt.length >= RATE_MAX_MESSAGES) {
      this.send(client.socket, { type: 'error', message: 'You are sending messages too fast' });
      return;
    }
    client.sentAt.push(now);

    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      this.send(client.socket, { type: 'error', message: 'Invalid message format' });
      return;
    }
    const event = chatClientEventSchema.safeParse(parsed);
    if (!event.success) {
      this.send(client.socket, {
        type: 'error',
        message: event.error.issues[0]?.message ?? 'Invalid message',
      });
      return;
    }

    try {
      const message = await this.chat.send(client.user.id, event.data.content);
      this.broadcast({ type: 'message', data: message });
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to store chat message');
      this.send(client.socket, { type: 'error', message: 'Could not send message' });
    }
  }

  private broadcastPresence() {
    const online = new Set([...this.clients].map((client) => client.user.id)).size;
    this.broadcast({ type: 'presence', online });
  }

  private broadcast(event: ChatServerEvent) {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) client.socket.send(payload);
    }
  }

  private send(socket: WebSocket, event: ChatServerEvent) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  }

  /** Drops dead connections and sockets whose session was revoked (logout) or expired. */
  private checkHeartbeats() {
    for (const client of this.clients) {
      if (!client.alive) {
        client.socket.terminate();
        continue;
      }
      client.alive = false;
      client.socket.ping();
      void this.authenticator
        .authenticate(client.token)
        .catch(() => null)
        .then((user) => {
          if (!user) client.socket.close(SESSION_EXPIRED, 'Session expired');
        });
    }
  }

  private reject(socket: Duplex, status: number, message: string) {
    socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
  }
}
