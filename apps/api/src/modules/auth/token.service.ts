import jwt from 'jsonwebtoken';
import { durationToMs } from '../../common/http/duration.js';

export interface TokenPayload {
  /** User id. */
  sub: number;
  username: string;
  /** Token version; must match `users.token_version` for the token to be accepted. */
  tv: number;
}

const ISSUER = 'ualgeddit-api';
const AUDIENCE = 'ualgeddit';

export class TokenService {
  readonly expiresInMs: number;

  constructor(
    private readonly secret: string,
    expiresIn: string,
  ) {
    this.expiresInMs = durationToMs(expiresIn);
  }

  sign(payload: TokenPayload): string {
    return jwt.sign({ username: payload.username, tv: payload.tv }, this.secret, {
      algorithm: 'HS256',
      subject: String(payload.sub),
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: Math.floor(this.expiresInMs / 1000),
    });
  }

  /** Returns the payload of a valid token, or `null` when it is invalid/expired. */
  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      if (typeof decoded === 'string') return null;
      const sub = Number(decoded.sub);
      if (!Number.isInteger(sub) || typeof decoded.tv !== 'number') return null;
      return { sub, username: String(decoded.username), tv: decoded.tv };
    } catch {
      return null;
    }
  }
}
