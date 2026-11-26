import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../../common/errors/app-error.js';
import { mockOf } from '../../../test/mocks.js';
import type { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import type { PasswordHasher } from './password-hasher.js';
import { TokenService } from './token.service.js';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const user = {
  id: 7,
  username: 'alice',
  passwordHash: 'hashed:secret123',
  avatarUrl: null,
  tokenVersion: 2,
};

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

describe('TokenService', () => {
  const tokens = new TokenService(SECRET, '1h');

  it('round-trips a payload', () => {
    const token = tokens.sign({ sub: 1, username: 'a', tv: 3 });
    expect(tokens.verify(token)).toEqual({ sub: 1, username: 'a', tv: 3 });
  });

  it('rejects tokens signed with another secret or algorithm', () => {
    const forged = jwt.sign({ tv: 0 }, 'another-secret-another-secret-another', { subject: '1' });
    expect(tokens.verify(forged)).toBeNull();
    expect(tokens.verify('not-a-token')).toBeNull();
  });

  it('rejects expired tokens', () => {
    const expired = new TokenService(SECRET, '1s');
    const token = jwt.sign({ tv: 0, username: 'a' }, SECRET, {
      subject: '1',
      issuer: 'ualgeddit-api',
      audience: 'ualgeddit',
      expiresIn: -10,
    });
    expect(expired.verify(token)).toBeNull();
  });
});

describe('AuthService', () => {
  let users: Mocked<UsersRepository>;
  let tokens: TokenService;
  let service: AuthService;

  beforeEach(() => {
    users = mockOf<UsersRepository>(
      'findByUsername',
      'create',
      'findAuthById',
      'findById',
      'incrementTokenVersion',
    );
    tokens = new TokenService(SECRET, '1h');
    service = new AuthService(users, fakeHasher, tokens);
  });

  it('registers a new user with a hashed password', async () => {
    users.findByUsername.mockResolvedValue(null);
    users.create.mockResolvedValue({ ...user, passwordHash: 'x' } as never);

    const result = await service.register({
      username: 'alice',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    expect(users.create).toHaveBeenCalledWith({
      username: 'alice',
      passwordHash: 'hashed:secret123',
    });
    expect(result.user).toEqual({ id: 7, username: 'alice', avatarUrl: null });
    expect(tokens.verify(result.token)?.tv).toBe(2);
  });

  it('rejects taken usernames (case-insensitive lookup)', async () => {
    users.findByUsername.mockResolvedValue(user as never);
    await expect(
      service.register({ username: 'ALICE', password: 'secret123', confirmPassword: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('logs in with valid credentials', async () => {
    users.findByUsername.mockResolvedValue(user as never);
    const result = await service.login({ username: 'alice', password: 'secret123' });
    expect(result.user.username).toBe('alice');
  });

  it.each([
    ['wrong password', user, 'nope'],
    ['unknown user', null, 'secret123'],
  ])('fails with a generic error for %s', async (_case, found, password) => {
    users.findByUsername.mockResolvedValue(found as never);
    await expect(service.login({ username: 'alice', password })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('authenticates tokens whose version matches the user', async () => {
    users.findAuthById.mockResolvedValue({ id: 7, username: 'alice', tokenVersion: 2 });
    const token = tokens.sign({ sub: 7, username: 'alice', tv: 2 });
    await expect(service.authenticate(token)).resolves.toEqual({ id: 7, username: 'alice' });
  });

  it('rejects revoked tokens (version bumped by logout)', async () => {
    users.findAuthById.mockResolvedValue({ id: 7, username: 'alice', tokenVersion: 3 });
    const token = tokens.sign({ sub: 7, username: 'alice', tv: 2 });
    await expect(service.authenticate(token)).resolves.toBeNull();
  });

  it('rejects tokens of deleted users', async () => {
    users.findAuthById.mockResolvedValue(null);
    await expect(
      service.authenticate(tokens.sign({ sub: 1, username: 'x', tv: 0 })),
    ).resolves.toBeNull();
  });

  it('logout bumps the token version', async () => {
    await service.logout(7);
    expect(users.incrementTokenVersion).toHaveBeenCalledWith(7);
  });
});
