import bcrypt from 'bcryptjs';
import { JwtPayload, SignOptions, Secret, sign, verify } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

import { env } from '../../config/env';
import { getDb, runInTransaction } from '../../database/client';
import { HttpError } from '../../utils/http-error';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

function mapUser(row: UserRecord) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createTokenPair(userId: string): Promise<TokenPair> {
  const jti = randomUUID();
  const accessToken = sign({ sub: userId }, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  });

  const refreshToken = sign({ sub: userId }, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: jti
  });

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(jti, userId, refreshTokenHash, new Date().toISOString(), expiresAt);

  return { accessToken, refreshToken };
}

export async function registerUser(data: { email: string; password: string; name: string }) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email) as
    | { id: string }
    | undefined;

  if (existing) {
    throw new HttpError(409, '该邮箱已注册', { code: 'EMAIL_TAKEN' });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const now = new Date().toISOString();
  const userId = randomUUID();

  runInTransaction(() => {
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, data.email, data.name, passwordHash, now, now);

    const accountId = randomUUID();
    db.prepare(
      `INSERT INTO accounts (id, user_id, name, type, currency, balance_cents, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(accountId, userId, '现金钱包', 'CASH', 'CNY', 0, now, now);

    const categories = [
      { name: '餐饮', type: 'EXPENSE' },
      { name: '交通', type: 'EXPENSE' },
      { name: '购物', type: 'EXPENSE' },
      { name: '工资', type: 'INCOME' },
      { name: '奖金', type: 'INCOME' }
    ];

    const insertCategory = db.prepare(
      `INSERT INTO categories (id, user_id, name, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const category of categories) {
      insertCategory.run(randomUUID(), userId, category.name, category.type, now, now);
    }
  });

  const userRow = db
    .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as UserRecord;

  const tokens = await createTokenPair(userId);

  return { user: mapUser(userRow), tokens };
}

export async function authenticateUser(data: { email: string; password: string }) {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = ?'
    )
    .get(data.email) as (UserRecord & { password_hash: string }) | undefined;

  if (!row) {
    throw new HttpError(401, '邮箱或密码不正确', { code: 'INVALID_CREDENTIALS' });
  }

  const isMatch = await bcrypt.compare(data.password, row.password_hash);
  if (!isMatch) {
    throw new HttpError(401, '邮箱或密码不正确', { code: 'INVALID_CREDENTIALS' });
  }

  const tokens = await createTokenPair(row.id);

  return { user: mapUser(row), tokens };
}

function assertRefreshPayload(
  payload: JwtPayload
): asserts payload is JwtPayload & { jti: string } {
  if (!payload.sub || !payload.jti) {
    throw new HttpError(401, 'refresh token 无效', { code: 'INVALID_REFRESH_TOKEN' });
  }
}

export async function rotateRefreshToken(token: string) {
  let payload: JwtPayload;

  try {
    payload = verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    throw new HttpError(401, 'refresh token 无效', { code: 'INVALID_REFRESH_TOKEN' });
  }

  assertRefreshPayload(payload);

  const db = getDb();
  const record = db
    .prepare(
      `SELECT id, user_id, token_hash, expires_at, revoked_at
       FROM refresh_tokens WHERE id = ? AND user_id = ?`
    )
    .get(payload.jti, payload.sub) as RefreshTokenRecord | undefined;

  if (!record) {
    throw new HttpError(401, 'refresh token 无效', { code: 'INVALID_REFRESH_TOKEN' });
  }

  if (record.revoked_at) {
    throw new HttpError(401, 'refresh token 已失效', { code: 'REFRESH_TOKEN_REVOKED' });
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    throw new HttpError(401, 'refresh token 已过期', { code: 'REFRESH_TOKEN_EXPIRED' });
  }

  const matches = await bcrypt.compare(token, record.token_hash);
  if (!matches) {
    throw new HttpError(401, 'refresh token 无效', { code: 'INVALID_REFRESH_TOKEN' });
  }

  runInTransaction(() => {
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      record.id
    );
  });

  const tokens = await createTokenPair(record.user_id);
  return { tokens };
}

export async function revokeRefreshToken(token: string) {
  let payload: JwtPayload;

  try {
    payload = verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (_error) {
    return;
  }

  if (!payload.sub || !payload.jti) {
    return;
  }

  const db = getDb();
  db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ? AND user_id = ?').run(
    new Date().toISOString(),
    payload.jti,
    payload.sub
  );
}

export function getUserById(id: string) {
  const db = getDb();
  const row = db
    .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
    .get(id) as UserRecord | undefined;

  if (!row) {
    throw new HttpError(404, '用户不存在', { code: 'USER_NOT_FOUND' });
  }

  return mapUser(row);
}
