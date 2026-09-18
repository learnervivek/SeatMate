import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(422).json({ message: 'Validation failed', errors: err.errors });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    res.status(409).json({ message: 'A record with these details already exists' });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
