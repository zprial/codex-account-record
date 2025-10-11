import request from 'supertest';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app';

export const app = createApp();

interface RegisterOptions {
  email?: string;
  password?: string;
  name?: string;
}

export async function registerTestUser(options: RegisterOptions = {}) {
  const email = options.email ?? `test-${randomUUID()}@example.com`;
  const password = options.password ?? 'test-password';
  const name = options.name ?? '测试用户';

  const response = await request(app).post('/api/auth/register').send({
    email,
    password,
    name
  });

  if (response.status !== 201) {
    throw new Error(`Failed to register test user: ${response.status} ${response.text}`);
  }

  return {
    email,
    password,
    name,
    user: response.body.user as { id: string; email: string; name: string },
    tokens: response.body.tokens as { accessToken: string; refreshToken: string }
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
