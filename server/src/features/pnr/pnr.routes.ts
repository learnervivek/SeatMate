import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { sensitiveActionRateLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { verifyPnr } from './pnr.controller';
import { verifyPnrSchema } from './pnr.validators';

export const pnrRouter = Router();

pnrRouter.use(requireAuth);

pnrRouter.post(
  '/verify',
  sensitiveActionRateLimiter,
  validate({ body: verifyPnrSchema }),
  verifyPnr,
);
