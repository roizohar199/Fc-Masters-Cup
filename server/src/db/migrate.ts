// ✅ קובץ: server/src/db/migrate.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export function runMigrations() {
  // נחשב נתיב DB נכון גם בהרצה מ־dist
  const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, "../tournaments.sqlite");

  if (!fs.existsSync(DB_PATH)) {
    console.warn(`[migrate] DB not found at ${DB_PATH}. It will be created.`);
  }

  const db = new Database(DB_PATH);

  // פונקציות עזר
  const hasColumn = (table: string, column: string) => {
    const rows = db.prepare(`PRAGMA table_info(${table});`).all() as Array<{ name: string }>;
    return rows.some(r => r.name === column);
  };

  const ensureColumn = (table: string, column: string, type: string, defaultExpr?: string) => {
    if (!hasColumn(table, column)) {
      const sql = defaultExpr
        ? `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultExpr};`
        : `ALTER TABLE ${table} ADD COLUMN ${column} ${type};`;
      console.log(`[migrate] Adding column ${table}.${column}`);
      db.exec(sql);
    }
  };

  try {
    db.exec("BEGIN;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE
      );
    `);

    ensureColumn("admins", "display_name", "TEXT");
    ensureColumn("users", "display_name", "TEXT");

    db.exec("COMMIT;");
    console.log("[migrate] OK ✅");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("[migrate] FAILED ❌", err);
  } finally {
    db.close();
  }
}
