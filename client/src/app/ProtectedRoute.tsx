import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <LoadingState label="Checking your session" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
