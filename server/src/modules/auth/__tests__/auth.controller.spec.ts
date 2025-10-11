import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { getDb } from '../../../database/client';

const app = createApp();

describe.sequential('Auth API', () => {
  it('registers a new user and returns tokens', async () => {
    const email = `user-${randomUUID()}@example.com`;
    const response = await request(app).post('/api/auth/register').send({
      email,
      password: 'test-password',
      name: '测试用户'
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user.id');
    expect(response.body).toHaveProperty('tokens.accessToken');
    expect(response.body).toHaveProperty('tokens.refreshToken');

    const db = getDb();
    const userRow = db.prepare('SELECT email FROM users WHERE email = ?').get(email) as
      | { email: string }
      | undefined;
    expect(userRow?.email).toBe(email);
  });

  it('logs in with existing credentials', async () => {
    const email = `login-${randomUUID()}@example.com`;
    await request(app).post('/api/auth/register').send({
      email,
      password: 'test-password',
      name: '测试登录'
    });

    const response = await request(app).post('/api/auth/login').send({
      email,
      password: 'test-password'
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokens.accessToken');
    expect(response.body.user.email).toBe(email);
  });
});
