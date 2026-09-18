import { create } from 'zustand';
import type { AppNotification } from '@/types/domain';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  setAll: (notifications: AppNotification[], unreadCount: number) => void;
  addNotification: (notification: AppNotification) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setAll: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
