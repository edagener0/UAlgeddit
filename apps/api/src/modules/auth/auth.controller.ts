import { loginSchema, registerSchema, type AuthResponse } from '@ualgeddit/shared';
import type { Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from '../../common/http/auth-cookie.js';
import { requireUser } from '../../common/http/types.js';
import type { AuthService } from './auth.service.js';

export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: { secure: boolean; maxAgeMs: number },
  ) {}

  register = async (req: Request, res: Response) => {
    const { user, token } = await this.auth.register(registerSchema.parse(req.body));
    setAuthCookie(res, token, this.cookie.secure, this.cookie.maxAgeMs);
    res.status(201).json({ user } satisfies AuthResponse);
  };

  login = async (req: Request, res: Response) => {
    const { user, token } = await this.auth.login(loginSchema.parse(req.body));
    setAuthCookie(res, token, this.cookie.secure, this.cookie.maxAgeMs);
    res.json({ user } satisfies AuthResponse);
  };

  logout = async (req: Request, res: Response) => {
    if (req.user) await this.auth.logout(req.user.id);
    clearAuthCookie(res, this.cookie.secure);
    res.status(204).end();
  };

  me = async (req: Request, res: Response) => {
    res.json(await this.auth.me(requireUser(req).id));
  };
}
