const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'locafy.db');

let db;
try {
  const BetterSqlite3 = require('better-sqlite3');
  db = new BetterSqlite3(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  // Fallback to Node.js 22 built-in SQLite (DatabaseSync) with 100% better-sqlite3 API compatibility
  const { DatabaseSync } = require('node:sqlite');
  const rawDb = new DatabaseSync(dbPath);

  const normalizeArgs = (args) => {
    if (args.length === 1 && Array.isArray(args[0])) {
      return args[0];
    }
    return args;
  };

  db = {
    exec: (sql) => rawDb.exec(sql),
    pragma: (pragmaStr) => {
      try {
        return rawDb.exec(`PRAGMA ${pragmaStr};`);
      } catch (e) {
        return null;
      }
    },
    prepare: (sql) => {
      const stmt = rawDb.prepare(sql);
      const origAll = stmt.all.bind(stmt);
      const origGet = stmt.get.bind(stmt);
      const origRun = stmt.run.bind(stmt);
      return {
        all: (...args) => origAll(...normalizeArgs(args)),
        get: (...args) => origGet(...normalizeArgs(args)),
        run: (...args) => origRun(...normalizeArgs(args)),
        iterate: (...args) => origAll(...normalizeArgs(args))[Symbol.iterator]()
      };
    },
    close: () => rawDb.close()
  };

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

// Execute schema.sql if database is fresh
const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

module.exports = db;
