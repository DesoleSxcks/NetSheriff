import { DatabaseSync } from 'node:sqlite';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_FILES_BY_ENV = {
  test: resolve('src', 'database', 'db.test.sqlite'),
  development: resolve('src', 'database', 'db.dev.sqlite'),
  production: resolve('src', 'database', 'db.sqlite'),
};

const dbFile =
  DB_FILES_BY_ENV[process.env.NODE_ENV] ?? DB_FILES_BY_ENV.development;

function parseParams(params = []) {
  return Array.isArray(params) ? params : [params];
}

function parseRow(row) {
  return row ? { ...row } : row;
}

function createPromiseDatabase(database) {
  return {
    async run(sql, params) {
      const result = database.prepare(sql).run(...parseParams(params));

      return {
        changes: result.changes,
        lastID: Number(result.lastInsertRowid),
      };
    },

    async get(sql, params) {
      return parseRow(database.prepare(sql).get(...parseParams(params)));
    },

    async all(sql, params) {
      return database
        .prepare(sql)
        .all(...parseParams(params))
        .map(parseRow);
    },

    async close() {
      database.close();
    },
  };
}

async function connect() {
  return createPromiseDatabase(new DatabaseSync(dbFile));
}

function dropDatabase() {
  if (existsSync(dbFile)) {
    rmSync(dbFile);
    console.log(`Removed database file: ${dbFile}`);
  } else {
    console.log(`Database file not found: ${dbFile}`);
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename && process.argv[2] === 'drop') {
  dropDatabase();
}

export default { connect, dropDatabase, dbFile };
