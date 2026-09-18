import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { login, logout, me, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validators';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), login);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, me);
