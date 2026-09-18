import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/apiClient';
import { registerRequest } from './api';
import { registerSchema, type RegisterFormValues } from './schemas';

export function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      const user = await registerRequest(values);
      setUser(user);
      navigate('/');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to create account'));
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
        <h1 className="font-serif text-2xl text-ink-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Verify a journey, name the seat you actually want, and find someone to swap with.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
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
            autoComplete="new-password"
            hint="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && <p className="text-sm text-rust-500">{formError}</p>}

          <Button type="submit" variant="accent" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-terracotta-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
