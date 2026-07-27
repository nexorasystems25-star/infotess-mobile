import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'infotess.db');

let _db: SqlJsDatabase;

function saveDb() {
  const data = _db.export();
  writeFileSync(dbPath, Buffer.from(data));
}

export async function initDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const buf = readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA journal_mode = WAL');
  _db.run('PRAGMA foreign_keys = ON');

  return _db;
}

export function getDb(): SqlJsDatabase {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

// Auto-save after mutations
export function saveAndReturn<T>(result: T): T {
  saveDb();
  return result;
}

// Wrapper to mimic better-sqlite3 style
export const db = {
  prepare(sql: string) {
    return {
      run(...params: any[]) {
        const stmt = getDb().prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        // Get last insert rowid
        const rowid = getDb().exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number || 0;
        saveDb();
        return { lastInsertRowid: rowid, changes: getDb().getRowsModified() };
      },
      get(...params: any[]) {
        const stmt = getDb().prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const obj: any = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          return obj;
        }
        stmt.free();
        return undefined;
      },
      all(...params: any[]) {
        const stmt = getDb().prepare(sql);
        stmt.bind(params);
        const rows: any[] = [];
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const obj: any = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          rows.push(obj);
        }
        stmt.free();
        return rows;
      },
    };
  },
  exec(sql: string) {
    getDb().exec(sql);
    saveDb();
  },
  prepareRun(sql: string, ...params: any[]) {
    const stmt = getDb().prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    const rowid = getDb().exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number || 0;
    saveDb();
    return { lastInsertRowid: rowid, changes: getDb().getRowsModified() };
  },
};

export default db;