import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { sensitiveActionRateLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import {
  acceptRequest,
  cancelRequest,
  listIncoming,
  listOutgoing,
  rejectRequest,
  sendSwapRequest,
} from './swap.controller';
import { createSwapRequestSchema, swapRequestIdParamSchema } from './swap.validators';

export const swapRouter = Router();

swapRouter.use(requireAuth);

swapRouter.post(
  '/',
  sensitiveActionRateLimiter,
  validate({ body: createSwapRequestSchema }),
  sendSwapRequest,
);
swapRouter.get('/incoming', listIncoming);
swapRouter.get('/outgoing', listOutgoing);
swapRouter.patch('/:id/accept', validate({ params: swapRequestIdParamSchema }), acceptRequest);
swapRouter.patch('/:id/reject', validate({ params: swapRequestIdParamSchema }), rejectRequest);
swapRouter.patch('/:id/cancel', validate({ params: swapRequestIdParamSchema }), cancelRequest);
