import bcrypt from 'bcryptjs';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 12) {}

  hash(plain: string) {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
