import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { listMyNotifications, markAllRead, markRead } from './notification.controller';
import { notificationIdParamSchema } from './notification.validators';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', listMyNotifications);
notificationRouter.patch('/read-all', markAllRead);
notificationRouter.patch(
  '/:notificationId/read',
  validate({ params: notificationIdParamSchema }),
  markRead,
);
