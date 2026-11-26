import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { NotFoundError } from '../errors/app-error.js';
import { toAppError } from './error-handler.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test' });

describe('toAppError', () => {
  it('passes AppErrors through', () => {
    const error = new NotFoundError('Post');
    expect(toAppError(error)).toBe(error);
  });

  it('maps ZodError to a 400 with field details', () => {
    const result = z.object({ title: z.string().min(1) }).safeParse({ title: '' });
    const error = toAppError(result.error);
    expect(error?.statusCode).toBe(400);
    expect(error?.details?.[0]?.path).toBe('title');
  });

  it.each([
    ['P2002', 409],
    ['P2025', 404],
    ['P2003', 400],
  ])('maps Prisma %s to %d', (code, status) => {
    expect(toAppError(prismaError(code))?.statusCode).toBe(status);
  });

  it('maps multer file size errors to 413', () => {
    expect(toAppError(new MulterError('LIMIT_FILE_SIZE'))?.statusCode).toBe(413);
    expect(toAppError(new MulterError('LIMIT_FILE_COUNT'))?.statusCode).toBe(400);
  });

  it('maps body-parser errors', () => {
    expect(toAppError({ type: 'entity.parse.failed', status: 400 })?.statusCode).toBe(400);
    expect(toAppError({ type: 'entity.too.large', status: 413 })?.statusCode).toBe(413);
  });

  it('returns null for unexpected errors', () => {
    expect(toAppError(new Error('kaboom'))).toBeNull();
    expect(toAppError(prismaError('P1001'))).toBeNull();
  });
});
