import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import {
  getUnreadCount,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.service';

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(req.user!.sub),
    getUnreadCount(req.user!.sub),
  ]);
  res.status(200).json({ notifications, unreadCount });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await markNotificationRead(req.user!.sub, req.params.notificationId as string);
  res.status(204).send();
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await markAllNotificationsRead(req.user!.sub);
  res.status(204).send();
});
