import { Prisma } from '@prisma/client';
import type { ApiErrorBody } from '@ualgeddit/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  ValidationError,
} from '../errors/app-error.js';

/** Converts any thrown value into an {@link AppError} (or `null` for unexpected errors). */
export function toAppError(error: unknown): AppError | null {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new ValidationError(
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return new PayloadTooLargeError('Image is too large');
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new BadRequestError(`Too many files or unexpected field "${error.field ?? ''}"`);
    }
    return new BadRequestError(error.message);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      return new ConflictError('A resource with that value already exists');
    if (error.code === 'P2025') return new NotFoundError();
    if (error.code === 'P2003') return new BadRequestError('Referenced resource does not exist');
  }

  // body-parser errors (malformed JSON, body too large) expose `status` and `type`.
  if (typeof error === 'object' && error !== null && 'type' in error && 'status' in error) {
    const { status, type } = error as { status: number; type: string };
    if (type === 'entity.parse.failed') return new BadRequestError('Malformed JSON body');
    if (type === 'entity.too.large') return new PayloadTooLargeError('Request body is too large');
    if (status >= 400 && status < 500) return new BadRequestError();
  }

  return null;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError = toAppError(error);

  if (!appError) {
    req.log?.error({ err: error }, 'Unhandled error');
    const body: ApiErrorBody = {
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    };
    res.status(500).json(body);
    return;
  }

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
    },
  };
  res.status(appError.statusCode).json(body);
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};
