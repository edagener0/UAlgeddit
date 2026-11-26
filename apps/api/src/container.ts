import type { Logger } from 'pino';
import type { Env } from './config/env.js';
import type { Database } from './lib/prisma.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher, type PasswordHasher } from './modules/auth/password-hasher.js';
import { TokenService } from './modules/auth/token.service.js';
import { ChatController } from './modules/chat/chat.controller.js';
import { ChatGateway } from './modules/chat/chat.gateway.js';
import { ChatRepository } from './modules/chat/chat.repository.js';
import { ChatService } from './modules/chat/chat.service.js';
import { CommentsController } from './modules/comments/comments.controller.js';
import { CommentsRepository } from './modules/comments/comments.repository.js';
import { CommentsService } from './modules/comments/comments.service.js';
import { FriendsController } from './modules/friends/friends.controller.js';
import { FriendsRepository } from './modules/friends/friends.repository.js';
import { FriendsService } from './modules/friends/friends.service.js';
import { PostsController } from './modules/posts/posts.controller.js';
import { PostsRepository } from './modules/posts/posts.repository.js';
import { PostsService } from './modules/posts/posts.service.js';
import { LocalDiskStorage, type StorageService } from './modules/storage/storage.service.js';
import { SubgedditsController } from './modules/subgeddits/subgeddits.controller.js';
import { SubgedditsRepository } from './modules/subgeddits/subgeddits.repository.js';
import { SubgedditsService } from './modules/subgeddits/subgeddits.service.js';
import { UsersController } from './modules/users/users.controller.js';
import { UsersRepository } from './modules/users/users.repository.js';
import { UsersService } from './modules/users/users.service.js';

export interface ContainerOverrides {
  storage?: StorageService;
  hasher?: PasswordHasher;
}

/**
 * Composition root: wires repositories -> services -> controllers.
 * This is the only place that knows about concrete implementations.
 */
export function createContainer(
  env: Env,
  db: Database,
  logger: Logger,
  overrides: ContainerOverrides = {},
) {
  const storage = overrides.storage ?? new LocalDiskStorage(env.UPLOAD_DIR, logger);
  const hasher = overrides.hasher ?? new BcryptPasswordHasher();
  const tokens = new TokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  const repositories = {
    users: new UsersRepository(db),
    friends: new FriendsRepository(db),
    subgeddits: new SubgedditsRepository(db),
    posts: new PostsRepository(db),
    comments: new CommentsRepository(db),
    chat: new ChatRepository(db),
  };

  const services = {
    auth: new AuthService(repositories.users, hasher, tokens),
    users: new UsersService(repositories.users, repositories.friends, storage),
    friends: new FriendsService(repositories.friends, repositories.users),
    subgeddits: new SubgedditsService(repositories.subgeddits, storage),
    posts: new PostsService(repositories.posts, repositories.subgeddits, storage),
    comments: new CommentsService(repositories.comments, storage),
    chat: new ChatService(repositories.chat),
  };

  const controllers = {
    auth: new AuthController(services.auth, {
      secure: env.COOKIE_SECURE,
      maxAgeMs: tokens.expiresInMs,
    }),
    users: new UsersController(services.users),
    friends: new FriendsController(services.friends),
    subgeddits: new SubgedditsController(services.subgeddits),
    posts: new PostsController(services.posts),
    comments: new CommentsController(services.comments),
    chat: new ChatController(services.chat),
  };

  const chatGateway = new ChatGateway(services.chat, services.auth, env.CORS_ORIGINS, logger);

  return { db, storage, repositories, services, controllers, chatGateway };
}

export type Container = ReturnType<typeof createContainer>;
