import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { getDb } from '../../../database/client';
import { app, authHeader, registerTestUser } from '../../../tests/test-utils';

describe.sequential('Transactions API', () => {
  it('creates an expense transaction and updates account balance', async () => {
    const { tokens, user } = await registerTestUser();
    const db = getDb();
    const account = db
      .prepare('SELECT id FROM accounts WHERE user_id = ? LIMIT 1')
      .get(user.id) as { id: string };
    const category = db
      .prepare("SELECT id FROM categories WHERE user_id = ? AND type = 'EXPENSE' LIMIT 1")
      .get(user.id) as { id: string };

    const createResponse = await request(app)
      .post('/api/transactions')
      .set(authHeader(tokens.accessToken))
      .send({
        amount: 120.5,
        type: 'EXPENSE',
        accountId: account.id,
        categoryId: category.id,
        occurredAt: new Date().toISOString(),
        description: '午餐',
        tags: ['工作日']
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      type: 'EXPENSE',
      amount: '120.50',
      account: { id: account.id }
    });

    const accountRow = db
      .prepare('SELECT balance_cents FROM accounts WHERE id = ?')
      .get(account.id) as { balance_cents: number };
    expect(accountRow.balance_cents).toBe(-12050);

    const listResponse = await request(app)
      .get('/api/transactions')
      .set(authHeader(tokens.accessToken));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items[0]).toMatchObject({ description: '午餐' });
  });

  it('handles transfer transactions across accounts', async () => {
    const { tokens, user } = await registerTestUser();
    const db = getDb();
    const sourceAccountResponse = await request(app)
      .post('/api/accounts')
      .set(authHeader(tokens.accessToken))
      .send({
        name: '工资卡',
        type: 'BANK',
        currency: 'CNY',
        initialBalance: 1000
      });

    expect(sourceAccountResponse.status).toBe(201);
    const sourceAccountId = sourceAccountResponse.body.id as string;

    const defaultAccount = db
      .prepare('SELECT id FROM accounts WHERE user_id = ? ORDER BY created_at ASC LIMIT 1')
      .get(user.id) as { id: string };

    const transferResponse = await request(app)
      .post('/api/transactions')
      .set(authHeader(tokens.accessToken))
      .send({
        amount: 200,
        type: 'TRANSFER',
        accountId: sourceAccountId,
        toAccountId: defaultAccount.id,
        occurredAt: new Date().toISOString(),
        description: '转账到现金'
      });

    expect(transferResponse.status).toBe(201);
    expect(transferResponse.body).toMatchObject({
      type: 'TRANSFER',
      account: { id: sourceAccountId },
      toAccount: { id: defaultAccount.id }
    });

    const balances = db
      .prepare('SELECT id, balance_cents FROM accounts WHERE id IN (?, ?) ORDER BY id')
      .all(sourceAccountId, defaultAccount.id) as { id: string; balance_cents: number }[];

    const sourceBalance = balances.find((item) => item.id === sourceAccountId);
    const defaultBalance = balances.find((item) => item.id === defaultAccount.id);

    expect(sourceBalance?.balance_cents).toBe(80000);
    expect(defaultBalance?.balance_cents).toBe(20000);
  });
});
