import request from 'supertest';
import { createApp } from '../app';
import type { PublicUser } from '../features/users/user.dto';

export function testAgent() {
  return request.agent(createApp());
}

export async function registerAndLogin(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<{ agent: ReturnType<typeof testAgent>; user: PublicUser }> {
  const agent = testAgent();
  const email =
    overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? 'password123';
  const name = overrides.name ?? 'Test User';

  const res = await agent.post('/api/auth/register').send({ name, email, password });
  if (res.status !== 201) {
    throw new Error(`registerAndLogin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user as PublicUser };
}
