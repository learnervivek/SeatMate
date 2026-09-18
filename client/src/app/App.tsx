import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/ui/LoadingState';
import { ToastContainer } from '@/components/ui/Toast';
import { fetchCurrentUser } from '@/features/auth/api';
import { LandingPage } from '@/features/landing/LandingPage';
import { useSocketNotifications } from '@/features/notifications/useSocketNotifications';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

// Code-split everything except the landing page (the first thing an
// anonymous visitor loads) — auth forms and the whole authenticated app
// (seat map, matching, swap forms) only need to download once someone
// actually signs in or up.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const JourneyPage = lazy(() =>
  import('@/features/journeys/JourneyPage').then((m) => ({ default: m.JourneyPage })),
);
const PreferencesPage = lazy(() =>
  import('@/features/preferences/PreferencesPage').then((m) => ({ default: m.PreferencesPage })),
);
const MatchesPage = lazy(() => import('@/features/swaps/MatchesPage').then((m) => ({ default: m.MatchesPage })));
const SwapRequestsPage = lazy(() =>
  import('@/features/swaps/SwapRequestsPage').then((m) => ({ default: m.SwapRequestsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <LoadingState label="Loading" />
    </div>
  );
}

export function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    setStatus('loading');
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setStatus('unauthenticated'));
  }, [setUser, setStatus]);

  useSocketNotifications();

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/journey" element={<JourneyPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/swaps" element={<SwapRequestsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
}
