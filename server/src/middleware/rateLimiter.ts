import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// The test suite exercises these endpoints far more times per window than a
// real client ever would (many isolated scenarios, each registering its own
// user). Rate limiting itself is covered by dedicated tests against a
// limiter instance built with a tiny window; the shared app-wide limiters
// stay off under NODE_ENV=test so unrelated tests don't 429 each other.
const skipInTest = () => env.NODE_ENV === 'test';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: 'Too many requests, please try again later' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: 'Too many attempts, please try again later' },
});

// For endpoints that are cheap to spam but costly/meaningful if abused
// (PNR lookups, creating swap requests) — tighter than the generic API
// limit, looser than login/registration since these are routine actions
// for an already-authenticated user.
export const sensitiveActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: 'Too many requests, please slow down and try again later' },
});
