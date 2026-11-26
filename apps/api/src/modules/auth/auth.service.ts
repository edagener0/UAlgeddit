import { randomUUID } from 'node:crypto';
import type {
  AuthUser,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
} from '@ualgeddit/shared';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors/app-error.js';
import type { StorageService } from '../storage/storage.service.js';
import type { TokenAuthenticator } from '../../common/middleware/authenticate.js';
import type { AuthenticatedUser } from '../../common/http/types.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { PasswordHasher } from './password-hasher.js';
import type { TokenService } from './token.service.js';

/** Internal result: the controller puts `token` in an httpOnly cookie, never in the body. */
export interface AuthResult {
  user: AuthUser;
  token: string;
}

type UserRecord = { id: number; username: string; avatarUrl: string | null; tokenVersion: number };

export class AuthService implements TokenAuthenticator {
  /** Hash of a random secret, compared against when the user does not exist. */
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly storage: StorageService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.users.findByUsername(input.username)) {
      throw new ConflictError('Username is already taken');
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({ username: input.username, passwordHash });
    return this.issue(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByUsername(input.username);
    // Always run bcrypt so response time does not reveal whether the user exists.
    const valid = await this.hasher.compare(
      input.password,
      user?.passwordHash ?? (await this.getDummyHash()),
    );
    if (!user || !valid) throw new UnauthorizedError('Invalid username or password');
    return this.issue(user);
  }

  /**
   * Changes the password after verifying the current one. Every other session is
   * revoked; the returned token keeps the current session signed in.
   */
  async changePassword(userId: number, input: ChangePasswordInput): Promise<AuthResult> {
    await this.verifyPassword(userId, input.currentPassword, 'currentPassword');
    const updated = await this.users.updatePassword(
      userId,
      await this.hasher.hash(input.newPassword),
    );
    return this.issue(updated);
  }

  /** Permanently deletes the account, its content and its uploaded files. */
  async deleteAccount(userId: number, input: DeleteAccountInput): Promise<void> {
    await this.verifyPassword(userId, input.password, 'password');
    const orphanedFiles = await this.users.deleteAccount(userId);
    await this.storage.deleteMany(orphanedFiles);
  }

  /** Invalidates every token previously issued to the user. */
  async logout(userId: number): Promise<void> {
    await this.users.incrementTokenVersion(userId);
  }

  async me(userId: number): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    return { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
  }

  async authenticate(token: string): Promise<AuthenticatedUser | null> {
    const payload = this.tokens.verify(token);
    if (!payload) return null;
    const user = await this.users.findAuthById(payload.sub);
    if (!user || user.tokenVersion !== payload.tv) return null;
    return { id: user.id, username: user.username };
  }

  /** Re-authentication for sensitive actions; a wrong password is reported on the form field. */
  private async verifyPassword(userId: number, password: string, field: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (!(await this.hasher.compare(password, user.passwordHash))) {
      throw new ValidationError([{ path: field, message: 'Incorrect password' }]);
    }
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(randomUUID());
    return this.dummyHash;
  }

  private issue(user: UserRecord): AuthResult {
    const token = this.tokens.sign({
      sub: user.id,
      username: user.username,
      tv: user.tokenVersion,
    });
    return { user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl }, token };
  }
}
