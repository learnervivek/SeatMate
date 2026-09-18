import { apiClient } from '@/lib/apiClient';
import type { AppNotification } from '@/types/domain';

export async function listNotificationsRequest(): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  const { data } = await apiClient.get<{
    notifications: AppNotification[];
    unreadCount: number;
  }>('/notifications');
  return data;
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
