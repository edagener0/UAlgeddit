import { beforeEach, describe, expect, it, type Mocked } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors/app-error.js';
import { mockOf, mockStorage } from '../../../test/mocks.js';
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
  let storage: ReturnType<typeof mockStorage>;

  beforeEach(() => {
    users = mockOf<UsersRepository>(
      'findByUsername',
      'create',
      'findAuthById',
      'findById',
      'incrementTokenVersion',
      'updatePassword',
      'deleteAccount',
    );
    tokens = new TokenService(SECRET, '1h');
    storage = mockStorage();
    service = new AuthService(users, fakeHasher, tokens, storage);
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

  describe('sensitive account actions', () => {
    const input = {
      currentPassword: 'secret123',
      newPassword: 'n3w-secret',
      confirmPassword: 'n3w-secret',
    };

    it('changes the password, revoking other sessions, and issues a new token', async () => {
      users.findById.mockResolvedValue(user as never);
      users.updatePassword.mockResolvedValue({ ...user, tokenVersion: 3 } as never);

      const result = await service.changePassword(7, input);

      expect(users.updatePassword).toHaveBeenCalledWith(7, 'hashed:n3w-secret');
      expect(tokens.verify(result.token)?.tv).toBe(3);
    });

    it('rejects a wrong current password on the form field', async () => {
      users.findById.mockResolvedValue(user as never);
      const error = await service
        .changePassword(7, { ...input, currentPassword: 'nope' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).details?.[0]?.path).toBe('currentPassword');
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('deletes the account and its orphaned files after re-authentication', async () => {
      users.findById.mockResolvedValue(user as never);
      users.deleteAccount.mockResolvedValue(['/uploads/a.webp']);

      await service.deleteAccount(7, { password: 'secret123' });

      expect(users.deleteAccount).toHaveBeenCalledWith(7);
      expect(storage.deleteMany).toHaveBeenCalledWith(['/uploads/a.webp']);
    });

    it('does not delete the account with a wrong password', async () => {
      users.findById.mockResolvedValue(user as never);
      await expect(service.deleteAccount(7, { password: 'nope' })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(users.deleteAccount).not.toHaveBeenCalled();
    });
  });
});
