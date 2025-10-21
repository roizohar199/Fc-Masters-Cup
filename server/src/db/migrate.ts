// server/src/db/migrate.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// במסלול הריצה (dist) קובץ ה־DB יושב תיקייה אחת מעל:
const DEFAULT_DB = path.resolve(__dirname, "../tournaments.sqlite");
const DB_PATH = process.env.DB_PATH || DEFAULT_DB;

if (!fs.existsSync(DB_PATH)) {
  console.warn(`[migrate] DB not found at ${DB_PATH}. It will be created if required tables are missing.`);
}

const db = new Database(DB_PATH);

// בדיקת עמודה בטבלה
function hasColumn(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table});`).all() as Array<{ name: string }>;
  return rows.some(r => r.name === column);
}

// הוספת עמודה אם חסרה (איידמפוטנטי)
function ensureColumn(table: string, column: string, type: string, defaultExpr?: string) {
  if (!hasColumn(table, column)) {
    const sql = defaultExpr
      ? `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultExpr};`
      : `ALTER TABLE ${table} ADD COLUMN ${column} ${type};`;
    console.log(`[migrate] Adding column ${table}.${column} (${type})`);
    db.exec(sql);

    // אתחול ראשוני לתצוגה – נגזור שם משתמש מהאימייל אם קיים
    if (column === "display_name" && hasColumn(table, "email")) {
      db.exec(`
        UPDATE ${table}
        SET display_name = COALESCE(display_name, substr(email, 1, instr(email, '@')-1))
        WHERE display_name IS NULL OR display_name = '';
      `);
    }
  }
}

export function runMigrations() {
  db.exec("BEGIN;");
  try {
    // ודא קיום טבלאות בסיס (למקרה חדש)
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

    // עמודות הדרושות
    ensureColumn("admins", "display_name", "TEXT");
    ensureColumn("users",  "display_name", "TEXT");

    db.exec("COMMIT;");
    console.log("[migrate] OK");
  } catch (e) {
    db.exec("ROLLBACK;");
    console.error("[migrate] FAILED:", e);
    throw e;
  } finally {
    db.close();
  }
}

// מריצים מיד בעת import
runMigrations();
