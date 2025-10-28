/**
 * סקריפט לאיפוס טבלת users
 * השתמש בזה רק אם יש בעיות עם הסכימה הישנה
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { createDbConnection } from "./db.js";

// טען .env
const envPath = resolve(process.cwd(), "../.env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

const db = createDbConnection();

console.log("🔍 בודק מבנה טבלת users...");

try {
  // בדיקת מבנה הטבלה הקיים
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  console.log("📋 מבנה טבלה נוכחי:", tableInfo);

  // אם יש עמודה status, הכל בסדר
  const hasStatus = tableInfo.some((col: any) => col.name === "status");
  
  if (!hasStatus) {
    console.log("⚠️ חסרה עמודת status - מוסיף...");
    db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
    console.log("✅ עמודת status נוספה!");
  } else {
    console.log("✅ מבנה הטבלה תקין!");
  }

  // ספירת משתמשים
  const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  console.log(`👥 סה"כ משתמשים: ${count.count}`);

  // רשימת משתמשים
  const users = db.prepare("SELECT email, role, status FROM users").all();
  console.log("📝 משתמשים במערכת:");
  users.forEach((u: any) => {
    console.log(`  - ${u.email} (${u.role}) [${u.status || 'active'}]`);
  });

} catch (error) {
  console.error("❌ שגיאה:", error);
  
  console.log("\n🔄 מנסה לאפס טבלה לחלוטין...");
  
  try {
    db.exec(`DROP TABLE IF EXISTS users`);
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'player',
        secondPrizeCredit REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        createdAt TEXT NOT NULL
      )
    `);
    console.log("✅ טבלת users נוצרה מחדש בהצלחה!");
    console.log("💡 הרץ את השרת כדי ליצור את משתמש האדמין אוטומטית");
  } catch (resetError) {
    console.error("❌ שגיאה באיפוס:", resetError);
  }
}

db.close();
console.log("\n✅ סיים!");
