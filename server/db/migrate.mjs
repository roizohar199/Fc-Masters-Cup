// server/db/migrate.mjs
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.resolve("./server/tournaments.sqlite");
if (!fs.existsSync(DB_PATH)) {
  console.warn(`[migrate] DB file not found at ${DB_PATH}. It will be created on first use.`);
}
const db = new Database(DB_PATH);

// helper: does table have column?
function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table});`).all();
  return rows.some(r => r.name === column);
}

// helper: safe ALTER TABLE ADD COLUMN (idempotent)
function ensureColumn(table, column, type, defaultExpr = null) {
  if (!hasColumn(table, column)) {
    const sql = defaultExpr
      ? `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultExpr};`
      : `ALTER TABLE ${table} ADD COLUMN ${column} ${type};`;
    console.log(`[migrate] Adding column ${table}.${column} (${type})`);
    db.exec(sql);
    // אופציונלי: לאתחל ערך ראשוני קיים (למשל מה-email)
    if (column === "display_name" && hasColumn(table, "email")) {
      db.exec(`
        UPDATE ${table}
        SET display_name = COALESCE(display_name, substr(email, 1, instr(email, '@')-1))
        WHERE display_name IS NULL;
      `);
    }
  }
}

// הרצות מיגרציה
db.exec("BEGIN;");
try {
  // בדוק שטבלת users קיימת
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  if (tables.length === 0) {
    console.warn("[migrate] ⚠️ users table not found - DB might be empty or corrupt");
  }

  // הוסף display_name לטבלת users אם חסר
  ensureColumn("users", "display_name", "TEXT");

  db.exec("COMMIT;");
  console.log("[migrate] ✅ Migration completed successfully");
} catch (e) {
  db.exec("ROLLBACK;");
  console.error("[migrate] ❌ FAILED:", e);
  throw e;
} finally {
  db.close();
}

