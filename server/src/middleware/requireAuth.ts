import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../lib/errors';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[env.COOKIE_NAME];

  if (!token) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired session'));
  }
}
