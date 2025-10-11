import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./server/data/test.db';
const dbPath = resolveDatabasePath(databaseUrl);

let dbModule: typeof import('./src/database/client') | null = null;

function resolveDatabasePath(url: string) {
  if (url === ':memory:') {
    return url;
  }

  if (url.startsWith('file:')) {
    const relative = url.slice('file:'.length);
    return path.resolve(process.cwd(), relative);
  }

  if (path.isAbsolute(url)) {
    return url;
  }

  return path.resolve(process.cwd(), url);
}

function removeDatabaseFile() {
  if (dbPath === ':memory:') {
    return;
  }

  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.rmSync(dbPath, { force: true });
  fs.rmSync(`${dbPath}-wal`, { force: true });
  fs.rmSync(`${dbPath}-shm`, { force: true });
}

function clearDatabase() {
  if (!dbModule) {
    return;
  }

  const db = dbModule.getDb();
  const reset = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM budgets').run();
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM users').run();
  });

  reset();
}

beforeAll(async () => {
  removeDatabaseFile();
  dbModule = await import('./src/database/client');
  dbModule.getDb();
  clearDatabase();
});

beforeEach(() => {
  clearDatabase();
});

afterAll(() => {
  if (dbModule) {
    dbModule.closeDb();
  }
  removeDatabaseFile();
});
