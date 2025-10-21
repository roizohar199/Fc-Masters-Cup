import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, "../tournaments.sqlite");
const db = new Database(DB_PATH);

console.log("🔧 Running migration: 2025_10_21_notifications.sql");

try {
  const migrationSQL = readFileSync(join(__dirname, "../migrations/2025_10_21_notifications.sql"), "utf8");
  db.exec(migrationSQL);
  console.log("✅ Migration completed successfully");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
