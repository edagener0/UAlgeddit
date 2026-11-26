import { randomUUID } from 'node:crypto';
import type { AuthUser, LoginInput, RegisterInput } from '@ualgeddit/shared';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../common/errors/app-error.js';
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
