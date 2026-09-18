import { emitToUser } from '../../sockets';
import type { NotificationType } from '../../types/domain';
import { NotificationModel, type NotificationDocument } from './notification.model';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedSwapRequestId?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationDocument> {
  const notification = await NotificationModel.create(input);
  emitToUser(input.userId, 'notification:new', notification);
  return notification;
}

export async function listNotificationsForUser(userId: string): Promise<NotificationDocument[]> {
  return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await NotificationModel.updateOne({ _id: notificationId, userId }, { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await NotificationModel.updateMany({ userId, read: false }, { read: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return NotificationModel.countDocuments({ userId, read: false });
}
