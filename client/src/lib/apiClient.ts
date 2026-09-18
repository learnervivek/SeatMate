import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// A 401 from any authenticated call means the session has expired or been
// invalidated server-side (cookie past its maxAge, server restarted with a
// different JWT_SECRET, etc.) — bounce to login rather than leaving the
// user staring at a page full of failed requests. Gated on `status ===
// 'authenticated'` so this never fires for the expected 401 on the initial
// GET /auth/me bootstrap check (a logged-out visitor), which is handled
// separately by App.tsx.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const { status, clear } = useAuthStore.getState();
      if (status === 'authenticated') {
        clear();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?expired=1');
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[] | undefined>;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
