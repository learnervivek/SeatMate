import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutRequest().catch(() => undefined);
    clear();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Profile</h1>
        <p className="mt-1.5 text-sm text-ink-500">Your SeatMate account details.</p>
      </div>

      <Card className="max-w-md">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-ink-900 font-serif text-xl text-stone-50">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-base font-semibold text-ink-900">{user.name}</p>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 flex flex-col gap-3 border-t border-warmgray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-400">Member since</dt>
            <dd className="font-medium text-ink-800">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-warmgray-200 pt-4">
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
