import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, "_" and "-" are allowed');

/** bcrypt silently ignores everything after 72 *bytes*, so the limit is checked in UTF-8 bytes. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Password is too long (accented characters count double)',
  )
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(20),
  password: z.string().min(1, 'Password is required').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** The authenticated user, as returned by `/auth/me`, `/auth/login` and `/auth/register`. */
export interface AuthUser {
  id: number;
  username: string;
  avatarUrl: string | null;
}

/** The session token is only ever sent as an httpOnly cookie, never in the body. */
export interface AuthResponse {
  user: AuthUser;
}
