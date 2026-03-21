import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

export const createDatabase = async (dbPath) => {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const SQL = await initSqlJs({
    locateFile: (file) => path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const existingFile = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  const sqliteDb = new SQL.Database(existingFile);

  const persist = () => {
    const data = sqliteDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };

  const normalizeParams = (params) => {
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  };

  const db = {
    async exec(sql) {
      sqliteDb.exec(sql);
      persist();
    },

    async run(sql, ...params) {
      sqliteDb.run(sql, normalizeParams(params));
      persist();
      return { changes: sqliteDb.getRowsModified() };
    },

    async get(sql, ...params) {
      const statement = sqliteDb.prepare(sql, normalizeParams(params));
      try {
        return statement.step() ? statement.getAsObject() : undefined;
      } finally {
        statement.free();
      }
    },

    async all(sql, ...params) {
      const statement = sqliteDb.prepare(sql, normalizeParams(params));
      try {
        const rows = [];
        while (statement.step()) {
          rows.push(statement.getAsObject());
        }
        return rows;
      } finally {
        statement.free();
      }
    },
  };

  await db.exec(`PRAGMA foreign_keys = ON;`);
  await db.exec(`PRAGMA journal_mode = WAL;`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS gateways (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      vendor TEXT NOT NULL DEFAULT 'generic',
      site_name TEXT,
      auth_header TEXT NOT NULL DEFAULT 'Authorization',
      config_path TEXT NOT NULL DEFAULT '/api/config/export',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gateway_api_keys (
      id TEXT PRIMARY KEY,
      gateway_id TEXT NOT NULL,
      name TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      FOREIGN KEY(gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gateway_config_cache (
      id TEXT PRIMARY KEY,
      gateway_id TEXT NOT NULL,
      api_key_id TEXT NOT NULL,
      status TEXT NOT NULL,
      config_sha256 TEXT,
      config_blob TEXT,
      metadata_json TEXT,
      error_text TEXT,
      fetched_at TEXT NOT NULL,
      FOREIGN KEY(gateway_id) REFERENCES gateways(id) ON DELETE CASCADE,
      FOREIGN KEY(api_key_id) REFERENCES gateway_api_keys(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_gateway_api_keys_gateway_id
      ON gateway_api_keys(gateway_id);

    CREATE INDEX IF NOT EXISTS idx_gateway_config_cache_gateway_id
      ON gateway_config_cache(gateway_id, fetched_at DESC);
  `);

  return db;
};
