import { randomUUID } from 'node:crypto';

import { getDb, runInTransaction } from '../../database/client';
import { HttpError } from '../../utils/http-error';
import { centsToString, toCents } from '../../utils/money';

interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  currency: string;
  balance_cents: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function mapAccount(row: AccountRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    balance: centsToString(row.balance_cents),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getAccountRow(userId: string, accountId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, user_id, name, type, currency, balance_cents, is_archived, created_at, updated_at
       FROM accounts WHERE id = ? AND user_id = ?`
    )
    .get(accountId, userId) as AccountRow | undefined;

  if (!row) {
    throw new HttpError(404, '账户不存在', { code: 'ACCOUNT_NOT_FOUND' });
  }

  return row;
}

export function listAccounts(userId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, user_id, name, type, currency, balance_cents, is_archived, created_at, updated_at
       FROM accounts WHERE user_id = ? ORDER BY created_at ASC`
    )
    .all(userId) as AccountRow[];

  return rows.map(mapAccount);
}

export function createAccount(
  userId: string,
  data: { name: string; type: string; currency: string; initialBalance: number }
) {
  const db = getDb();
  const accountId = randomUUID();
  const now = new Date().toISOString();
  const balanceCents = toCents(data.initialBalance);

  runInTransaction(() => {
    db.prepare(
      `INSERT INTO accounts (id, user_id, name, type, currency, balance_cents, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(accountId, userId, data.name, data.type, data.currency, balanceCents, now, now);
  });

  return mapAccount(getAccountRow(userId, accountId));
}

export function updateAccount(
  userId: string,
  accountId: string,
  data: { name?: string; type?: string; currency?: string; isArchived?: boolean }
) {
  const db = getDb();
  const existing = getAccountRow(userId, accountId);
  const now = new Date().toISOString();

  const name = data.name ?? existing.name;
  const type = data.type ?? existing.type;
  const currency = data.currency ?? existing.currency;
  const isArchived = data.isArchived ?? Boolean(existing.is_archived);

  runInTransaction(() => {
    db.prepare(
      `UPDATE accounts SET name = ?, type = ?, currency = ?, is_archived = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(name, type, currency, isArchived ? 1 : 0, now, accountId, userId);
  });

  return mapAccount(getAccountRow(userId, accountId));
}

export function deleteAccount(userId: string, accountId: string) {
  const db = getDb();
  getAccountRow(userId, accountId);
  const now = new Date().toISOString();

  runInTransaction(() => {
    db.prepare(
      'UPDATE accounts SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(now, accountId, userId);
  });
}
