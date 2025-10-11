import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { getDb } from '../../../database/client';
import { app, authHeader, registerTestUser } from '../../../tests/test-utils';

describe.sequential('Accounts API', () => {
  it('returns default cash account after registration', async () => {
    const { tokens } = await registerTestUser();

    const response = await request(app).get('/api/accounts').set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0]).toMatchObject({
      name: '现金钱包',
      type: 'CASH',
      balance: '0.00'
    });
  });

  it('creates a new account with initial balance', async () => {
    const { tokens } = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/accounts')
      .set(authHeader(tokens.accessToken))
      .send({
        name: '招商银行储蓄卡',
        type: 'BANK',
        currency: 'CNY',
        initialBalance: 2560.75
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: '招商银行储蓄卡',
      type: 'BANK',
      balance: '2560.75'
    });

    const db = getDb();
    const accountRow = db
      .prepare('SELECT balance_cents FROM accounts WHERE id = ?')
      .get(createResponse.body.id) as { balance_cents: number } | undefined;
    expect(accountRow?.balance_cents).toBe(256075);
  });
});
