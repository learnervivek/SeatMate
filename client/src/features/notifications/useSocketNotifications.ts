import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socketClient';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { AppNotification } from '@/types/domain';
import { listNotificationsRequest } from './api';

export function useSocketNotifications(): void {
  // Keyed on the user's id, not just an authenticated/not boolean — if a
  // different user logs in client-side (no full page reload) while a socket
  // for the previous user is still connected, `connectSocket()`'s "already
  // connected, reuse it" guard would otherwise leave the app talking to the
  // wrong user's room and showing their stale notifications.
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const setAll = useNotificationStore((state) => state.setAll);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      setAll([], 0);
      return;
    }

    // Tear down any connection left over from a different user before
    // establishing this one, so connectSocket() can't just hand back a
    // stale socket that's still authenticated as someone else.
    disconnectSocket();
    const socket = connectSocket();

    // MongoDB is the source of truth, not the socket — re-sync from the API
    // every time the socket (re)connects, so a dropped connection (network
    // blip, laptop sleep, server restart) never leaves a permanent gap in
    // what notifications were missed while disconnected. This fires once
    // for the initial connection and again after every automatic reconnect.
    const handleConnect = () => {
      listNotificationsRequest()
        .then(({ notifications, unreadCount }) => setAll(notifications, unreadCount))
        .catch(() => undefined);
    };
    const handleNew = (notification: AppNotification) => addNotification(notification);

    // Socket.IO retries on its own with backoff; we just need to not treat a
    // dropped/rejected connection as fatal — the REST API is always there.
    const handleConnectError = () => undefined;

    socket.on('connect', handleConnect);
    socket.on('notification:new', handleNew);
    socket.on('connect_error', handleConnectError);
    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:new', handleNew);
      socket.off('connect_error', handleConnectError);
    };
  }, [userId, setAll, addNotification]);
}
