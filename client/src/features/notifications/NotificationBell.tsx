import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '@/store/notificationStore';
import { markAllNotificationsReadRequest } from './api';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      markAllRead();
      await markAllNotificationsReadRequest().catch(() => undefined);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-sm p-2 text-ink-600 hover:bg-stone-100"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-terracotta-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-md border border-warmgray-200 bg-white shadow-raised">
          <div className="border-b border-warmgray-200 px-4 py-3 text-sm font-semibold text-ink-800">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-400">
                You&apos;ll see swap requests and responses here.
              </p>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-stone-100 px-4 py-3 text-sm last:border-b-0 ${
                    notification.read ? 'bg-white' : 'bg-terracotta-50'
                  }`}
                >
                  <p className="font-medium text-ink-800">{notification.title}</p>
                  <p className="mt-0.5 text-ink-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatTime(notification.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-warmgray-200 px-4 py-2.5 text-center text-sm font-medium text-terracotta-600 hover:bg-stone-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
