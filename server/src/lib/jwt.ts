import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converts a jsonwebtoken-style `expiresIn` string (e.g. "7d", "15m", "3600")
 * to milliseconds, so the auth cookie's `maxAge` always matches how long the
 * JWT itself is actually valid for — a mismatch here would mean the cookie
 * outlives the token (silent "invalid session" errors on stale-but-present
 * cookies) or the cookie is dropped before the token expires (forcing an
 * unnecessary re-login while the token was still good).
 */
export function accessTokenMaxAgeMs(): number {
  const raw = env.JWT_EXPIRES_IN.trim();
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(raw);
  if (!match) {
    return 7 * DURATION_UNIT_MS.d!;
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  return value * (DURATION_UNIT_MS[unit] ?? DURATION_UNIT_MS.s!);
}
