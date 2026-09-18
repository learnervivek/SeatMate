import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/apiClient';
import { loginRequest } from './api';
import { loginSchema, type LoginFormValues } from './schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const user = await loginRequest(values);
      setUser(user);
      navigate('/');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to log in'));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-stone-50 px-4">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink-900 text-xs font-semibold text-stone-50">
          SM
        </span>
        <span className="font-serif text-xl text-ink-900">SeatMate</span>
      </div>

      <Card>
        <h1 className="font-serif text-2xl text-ink-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Log in to check your journeys and pending seat swaps.
        </p>

        {sessionExpired && (
          <p className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-600">
            Your session expired. Please log in again.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && <p className="text-sm text-rust-500">{formError}</p>}

          <Button type="submit" variant="accent" isLoading={isSubmitting} className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-terracotta-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
