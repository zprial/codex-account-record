import { randomUUID } from 'node:crypto';

import { getDb, runInTransaction } from '../../database/client';
import { HttpError } from '../../utils/http-error';
import { centsToString, toCents } from '../../utils/money';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput
} from './transactions.schema';

interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  currency: string;
}

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
}

function validateCategoryForType(category: CategoryRow, transactionType: string) {
  if (transactionType === 'TRANSFER') {
    throw new HttpError(400, '转账交易不支持分类', { code: 'TRANSFER_CATEGORY_NOT_ALLOWED' });
  }

  if (category.type !== transactionType) {
    throw new HttpError(400, '分类类型与交易类型不匹配', { code: 'CATEGORY_TYPE_MISMATCH' });
  }
}

interface TransactionRow {
  id: string;
  user_id: string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  type: string;
  amount_cents: number;
  occurred_at: string;
  description: string | null;
  tags: string;
  attachments: string;
  ai_job_id: string | null;
  created_at: string;
  updated_at: string;
  account_name: string;
  account_type: string;
  account_currency: string;
  to_account_name: string | null;
  to_account_type: string | null;
  category_name: string | null;
  category_type: string | null;
}

function ensureAccount(userId: string, accountId: string): AccountRow {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, user_id, name, type, currency FROM accounts WHERE id = ? AND user_id = ?`)
    .get(accountId, userId) as AccountRow | undefined;

  if (!row) {
    throw new HttpError(404, '账户不存在', { code: 'ACCOUNT_NOT_FOUND' });
  }

  return row;
}

function ensureCategory(userId: string, categoryId: string): CategoryRow {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?`)
    .get(categoryId, userId) as CategoryRow | undefined;

  if (!row) {
    throw new HttpError(404, '分类不存在', { code: 'CATEGORY_NOT_FOUND' });
  }

  return row;
}

function getTransactionRow(userId: string, transactionId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         t.id,
         t.user_id,
         t.account_id,
         t.to_account_id,
         t.category_id,
         t.type,
         t.amount_cents,
         t.occurred_at,
         t.description,
         t.tags,
         t.attachments,
         t.ai_job_id,
         t.created_at,
         t.updated_at,
         a.name AS account_name,
         a.type AS account_type,
         a.currency AS account_currency,
         ta.name AS to_account_name,
         ta.type AS to_account_type,
         c.name AS category_name,
         c.type AS category_type
       FROM transactions t
       INNER JOIN accounts a ON a.id = t.account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ? AND t.user_id = ?`
    )
    .get(transactionId, userId) as TransactionRow | undefined;

  if (!row) {
    throw new HttpError(404, '交易不存在', { code: 'TRANSACTION_NOT_FOUND' });
  }

  return row;
}

function parseJsonArray(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function mapTransaction(row: TransactionRow) {
  return {
    id: row.id,
    type: row.type,
    amount: centsToString(row.amount_cents),
    occurredAt: row.occurred_at,
    description: row.description,
    tags: parseJsonArray(row.tags),
    attachments: parseJsonArray(row.attachments),
    aiJobId: row.ai_job_id,
    account: {
      id: row.account_id,
      name: row.account_name,
      type: row.account_type,
      currency: row.account_currency
    },
    toAccount: row.to_account_id
      ? {
          id: row.to_account_id,
          name: row.to_account_name,
          type: row.to_account_type
        }
      : undefined,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          type: row.category_type
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function applyBalanceChange(accountId: string, deltaCents: number) {
  const db = getDb();
  db.prepare(
    'UPDATE accounts SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?'
  ).run(deltaCents, new Date().toISOString(), accountId);
}

function revertTransactionEffect(row: TransactionRow) {
  const amount = row.amount_cents;
  if (row.type === 'EXPENSE') {
    applyBalanceChange(row.account_id, amount);
  } else if (row.type === 'INCOME') {
    applyBalanceChange(row.account_id, -amount);
  } else if (row.type === 'TRANSFER') {
    applyBalanceChange(row.account_id, amount);
    if (row.to_account_id) {
      applyBalanceChange(row.to_account_id, -amount);
    }
  }
}

function applyTransactionEffect(
  type: string,
  accountId: string,
  amountCents: number,
  toAccountId?: string
) {
  if (type === 'EXPENSE') {
    applyBalanceChange(accountId, -amountCents);
  } else if (type === 'INCOME') {
    applyBalanceChange(accountId, amountCents);
  } else if (type === 'TRANSFER') {
    if (!toAccountId) {
      throw new HttpError(400, '转账交易需要目标账户', { code: 'TRANSFER_TARGET_REQUIRED' });
    }
    applyBalanceChange(accountId, -amountCents);
    applyBalanceChange(toAccountId, amountCents);
  }
}

export function listTransactions(userId: string, query: ListTransactionsQuery) {
  const db = getDb();
  const filters = ['t.user_id = ?'];
  const params: unknown[] = [userId];

  if (query.type) {
    filters.push('t.type = ?');
    params.push(query.type);
  }

  if (query.accountId) {
    filters.push('t.account_id = ?');
    params.push(query.accountId);
  }

  if (query.categoryId) {
    filters.push('t.category_id = ?');
    params.push(query.categoryId);
  }

  if (query.dateFrom) {
    filters.push('t.occurred_at >= ?');
    params.push(new Date(query.dateFrom).toISOString());
  }

  if (query.dateTo) {
    filters.push('t.occurred_at <= ?');
    params.push(new Date(query.dateTo).toISOString());
  }

  if (query.keyword) {
    filters.push('(t.description LIKE ? OR t.ai_job_id LIKE ?)');
    const keyword = `%${query.keyword}%`;
    params.push(keyword, keyword);
  }

  const whereClause = filters.join(' AND ');
  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM transactions t WHERE ${whereClause}`)
    .get(...params) as { count: number };

  const orderBy = query.sortBy === 'amount' ? 't.amount_cents' : 't.occurred_at';
  const sortDirection = query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const offset = (query.page - 1) * query.pageSize;

  const rows = db
    .prepare(
      `SELECT
         t.id,
         t.user_id,
         t.account_id,
         t.to_account_id,
         t.category_id,
         t.type,
         t.amount_cents,
         t.occurred_at,
         t.description,
         t.tags,
         t.attachments,
         t.ai_job_id,
         t.created_at,
         t.updated_at,
         a.name AS account_name,
         a.type AS account_type,
         a.currency AS account_currency,
         ta.name AS to_account_name,
         ta.type AS to_account_type,
         c.name AS category_name,
         c.type AS category_type
       FROM transactions t
       INNER JOIN accounts a ON a.id = t.account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY ${orderBy} ${sortDirection}
       LIMIT ? OFFSET ?`
    )
    .all(...params, query.pageSize, offset) as TransactionRow[];

  const totalPages = totalRow.count === 0 ? 0 : Math.ceil(totalRow.count / query.pageSize);

  return {
    items: rows.map(mapTransaction),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems: totalRow.count,
      totalPages
    }
  };
}

export function getTransactionDetail(userId: string, transactionId: string) {
  const row = getTransactionRow(userId, transactionId);
  return mapTransaction(row);
}

export function createTransaction(userId: string, data: CreateTransactionInput) {
  if (data.amount <= 0) {
    throw new HttpError(400, '金额必须大于 0', { code: 'INVALID_AMOUNT' });
  }

  const primaryAccount = ensureAccount(userId, data.accountId);
  let targetAccount: AccountRow | undefined;

  if (data.type === 'TRANSFER') {
    if (!data.toAccountId) {
      throw new HttpError(400, '转账交易需要目标账户', { code: 'TRANSFER_TARGET_REQUIRED' });
    }
    if (data.toAccountId === data.accountId) {
      throw new HttpError(400, '转出账户与目标账户不能相同', { code: 'TRANSFER_SAME_ACCOUNT' });
    }
    targetAccount = ensureAccount(userId, data.toAccountId);
  }

  let category: CategoryRow | undefined;
  if (data.categoryId) {
    category = ensureCategory(userId, data.categoryId);
    validateCategoryForType(category, data.type);
  }

  const db = getDb();
  const transactionId = randomUUID();
  const now = new Date().toISOString();
  const amountCents = toCents(data.amount);
  const occurredAt = new Date(data.occurredAt).toISOString();
  const tagsJson = JSON.stringify(data.tags ?? []);
  const attachmentsJson = JSON.stringify(data.attachments ?? []);

  runInTransaction(() => {
    db.prepare(
      `INSERT INTO transactions (
         id,
         user_id,
         account_id,
         to_account_id,
         category_id,
         type,
         amount_cents,
         occurred_at,
         description,
         tags,
         attachments,
         ai_job_id,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      transactionId,
      userId,
      primaryAccount.id,
      targetAccount?.id ?? null,
      category?.id ?? null,
      data.type,
      amountCents,
      occurredAt,
      data.description ?? null,
      tagsJson,
      attachmentsJson,
      data.aiJobId ?? null,
      now,
      now
    );

    applyTransactionEffect(data.type, primaryAccount.id, amountCents, targetAccount?.id);
  });

  return mapTransaction(getTransactionRow(userId, transactionId));
}

export function updateTransaction(
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput
) {
  const existing = getTransactionRow(userId, transactionId);

  const newType = data.type ?? existing.type;
  const newAccountId = data.accountId ?? existing.account_id;
  const newToAccountId =
    newType === 'TRANSFER' ? (data.toAccountId ?? existing.to_account_id ?? undefined) : undefined;

  if (newType === 'TRANSFER' && !newToAccountId) {
    throw new HttpError(400, '转账交易需要目标账户', { code: 'TRANSFER_TARGET_REQUIRED' });
  }

  if (newType === 'TRANSFER' && newAccountId === newToAccountId) {
    throw new HttpError(400, '转出账户与目标账户不能相同', { code: 'TRANSFER_SAME_ACCOUNT' });
  }

  const primaryAccount = ensureAccount(userId, newAccountId);
  let targetAccount: AccountRow | undefined;
  if (newType === 'TRANSFER' && newToAccountId) {
    targetAccount = ensureAccount(userId, newToAccountId);
  }

  let category: CategoryRow | undefined;
  if (data.categoryId !== undefined) {
    if (data.categoryId) {
      category = ensureCategory(userId, data.categoryId);
      validateCategoryForType(category, newType);
    } else {
      category = undefined;
    }
  } else if (existing.category_id && newType !== 'TRANSFER') {
    category = ensureCategory(userId, existing.category_id);
    validateCategoryForType(category, newType);
  }

  const amountCents = data.amount !== undefined ? toCents(data.amount) : existing.amount_cents;
  if (amountCents <= 0) {
    throw new HttpError(400, '金额必须大于 0', { code: 'INVALID_AMOUNT' });
  }

  const occurredAt = data.occurredAt
    ? new Date(data.occurredAt).toISOString()
    : existing.occurred_at;
  const description = data.description ?? existing.description ?? null;
  const tagsJson = JSON.stringify(data.tags ?? parseJsonArray(existing.tags));
  const attachmentsJson = JSON.stringify(data.attachments ?? parseJsonArray(existing.attachments));
  const aiJobId = data.aiJobId ?? existing.ai_job_id ?? null;
  const now = new Date().toISOString();

  const db = getDb();

  runInTransaction(() => {
    revertTransactionEffect(existing);

    db.prepare(
      `UPDATE transactions SET
         account_id = ?,
         to_account_id = ?,
         category_id = ?,
         type = ?,
         amount_cents = ?,
         occurred_at = ?,
         description = ?,
         tags = ?,
         attachments = ?,
         ai_job_id = ?,
         updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(
      primaryAccount.id,
      targetAccount?.id ?? null,
      category?.id ?? null,
      newType,
      amountCents,
      occurredAt,
      description,
      tagsJson,
      attachmentsJson,
      aiJobId,
      now,
      transactionId,
      userId
    );

    const updatedRow = getTransactionRow(userId, transactionId);
    applyTransactionEffect(
      updatedRow.type,
      updatedRow.account_id,
      updatedRow.amount_cents,
      updatedRow.to_account_id ?? undefined
    );
  });

  return mapTransaction(getTransactionRow(userId, transactionId));
}

export function deleteTransaction(userId: string, transactionId: string) {
  const existing = getTransactionRow(userId, transactionId);
  const db = getDb();

  runInTransaction(() => {
    revertTransactionEffect(existing);
    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(transactionId, userId);
  });
}
