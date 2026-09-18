import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/store/notificationStore';
import { markAllNotificationsReadRequest } from './api';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  async function handleMarkAllRead() {
    markAllRead();
    await markAllNotificationsReadRequest().catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink-900">Notifications</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Swap requests, responses, and anything else that needs your attention.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You'll see swap requests and responses here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              padding="sm"
              className={notification.read ? undefined : 'border-terracotta-200 bg-terracotta-50'}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{notification.message}</p>
                </div>
                {!notification.read && (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-terracotta-500"
                    aria-label="Unread"
                  />
                )}
              </div>
              <p className="mt-2 text-xs text-ink-400">{formatTime(notification.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
