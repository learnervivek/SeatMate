import { apiClient } from '@/lib/apiClient';
import type { PublicUser } from '@/types/domain';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<PublicUser> {
  const { data } = await apiClient.post<{ user: PublicUser }>('/auth/register', payload);
  return data.user;
}

export async function loginRequest(payload: LoginPayload): Promise<PublicUser> {
  const { data } = await apiClient.post<{ user: PublicUser }>('/auth/login', payload);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<PublicUser> {
  const { data } = await apiClient.get<{ user: PublicUser }>('/auth/me');
  return data.user;
}
