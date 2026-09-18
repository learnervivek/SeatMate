import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { logoutRequest } from '@/features/auth/api';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutRequest().catch(() => undefined);
    clear();
    navigate('/login');
  }

  return (
    <header className="border-b border-warmgray-200 bg-stone-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-900 text-xs font-semibold text-stone-50">
            SM
          </span>
          <span className="font-serif text-lg text-ink-900">SeatMate</span>
        </Link>

        {user && (
          <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/dashboard" label="Dashboard" className="hidden sm:inline-flex" />
            <NavLink to="/journey" label="Journey" className="hidden sm:inline-flex" />
            <NavLink to="/swaps" label="Swaps" className="hidden sm:inline-flex" />
            <div className="ml-1 flex items-center gap-1 border-l border-warmgray-200 pl-2 sm:ml-2 sm:pl-3">
              <NotificationBell />
              <Link
                to="/profile"
                className="hidden rounded-sm px-2 py-1 text-sm text-ink-500 hover:bg-stone-100 hover:text-ink-800 md:inline"
              >
                {user.name}
              </Link>
              <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, label, className = '' }: { to: string; label: string; className?: string }) {
  return (
    <Link
      to={to}
      className={`rounded-sm px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-stone-100 hover:text-ink-900 ${className}`}
    >
      {label}
    </Link>
  );
}
