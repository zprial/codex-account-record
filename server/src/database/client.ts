import DatabaseConstructor from 'better-sqlite3';
import type { Database } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

import { env } from '../config/env';
import { applyMigrations } from './migrations';

let dbInstance: Database | null = null;

function resolveDatabasePath(url: string) {
  if (url.startsWith('file:')) {
    const relative = url.slice('file:'.length);
    return path.resolve(process.cwd(), relative);
  }

  if (path.isAbsolute(url)) {
    return url;
  }

  return path.resolve(process.cwd(), url);
}

function ensureDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = resolveDatabasePath(env.DATABASE_URL);
  const directory = path.dirname(dbPath);
  fs.mkdirSync(directory, { recursive: true });

  const database = new DatabaseConstructor(dbPath);
  try {
    database.pragma('journal_mode = WAL');
  } catch (_error) {
    // Fallback to default journal mode when WAL is not supported (e.g. ephemeral file systems).
  }
  database.pragma('foreign_keys = ON');

  applyMigrations(database);

  dbInstance = database;
  return database;
}

export function getDb() {
  return ensureDatabase();
}

export function runInTransaction<T>(callback: (db: Database) => T): T {
  const db = ensureDatabase();
  const execute = db.transaction(() => callback(db));
  return execute();
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
