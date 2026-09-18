import type { CookieOptions, Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { env, isProduction } from '../../config/env';
import { NotFoundError } from '../../lib/errors';
import { accessTokenMaxAgeMs } from '../../lib/jwt';
import { toPublicUser } from '../users/user.dto';
import { getUserById, loginUser, registerUser } from './auth.service';
import type { LoginInput, RegisterInput } from './auth.validators';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  // Kept in lockstep with the JWT's own expiration (see accessTokenMaxAgeMs)
  // so the cookie never outlives the token, or gets dropped before it.
  maxAge: accessTokenMaxAgeMs(),
  path: '/',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await registerUser(req.body as RegisterInput);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ user: toPublicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await loginUser(req.body as LoginInput);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(200).json({ user: toPublicUser(user) });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.sub);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.status(200).json({ user: toPublicUser(user) });
});
