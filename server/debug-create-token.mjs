#!/usr/bin/env node
/**
 * בודק למה createPasswordResetToken נכשל
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes, randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "tournaments.sqlite");
const db = new Database(dbPath);

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 Debug createPasswordResetToken");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const email = process.argv[2] || "yosiyoviv@gmail.com";
console.log("📧 Email:", email);
console.log();

// שלב 1: בדיקה אם המשתמש קיים
console.log("1️⃣ Checking if user exists...");
try {
  const user = db.prepare(`SELECT id, email, status FROM users WHERE email=?`).get(email);
  
  if (!user) {
    console.log("❌ User NOT FOUND in database!");
    console.log("\nAll users:");
    const allUsers = db.prepare(`SELECT email FROM users`).all();
    allUsers.forEach(u => console.log("  -", u.email));
    process.exit(1);
  }
  
  console.log("✅ User found:");
  console.log("   ID:", user.id);
  console.log("   Email:", user.email);
  console.log("   Status:", user.status);
  console.log();
} catch (error) {
  console.log("❌ Error checking user:", error.message);
  console.log(error);
  process.exit(1);
}

// שלב 2: בדיקה אם הטבלה password_resets קיימת
console.log("2️⃣ Checking password_resets table...");
try {
  const tableInfo = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='password_resets'`).get();
  
  if (!tableInfo) {
    console.log("❌ Table 'password_resets' does NOT exist!");
    console.log("\nCreating table...");
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
    
    console.log("✅ Table created!");
  } else {
    console.log("✅ Table exists");
  }
  console.log();
} catch (error) {
  console.log("❌ Error with password_resets table:", error.message);
  console.log(error);
  process.exit(1);
}

// שלב 3: ניסיון ליצור טוקן
console.log("3️⃣ Attempting to create token...");
try {
  // מחיקת טוקנים קיימים
  const deleteResult = db.prepare(`DELETE FROM password_resets WHERE email=?`).run(email);
  console.log(`   Deleted ${deleteResult.changes} old token(s)`);
  
  // יצירת טוקן חדש
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30*60*1000).toISOString();
  const id = randomUUID();
  
  const insertResult = db.prepare(`INSERT INTO password_resets (id,email,token,expiresAt,createdAt) VALUES (?,?,?,?,?)`).run(
    id, email, token, expiresAt, new Date().toISOString()
  );
  
  if (insertResult.changes === 1) {
    console.log("✅ Token created successfully!");
    console.log("   Token:", token.substring(0, 20) + "...");
    console.log("   Expires:", expiresAt);
  } else {
    console.log("❌ Failed to insert token");
  }
  console.log();
} catch (error) {
  console.log("❌ Error creating token:", error.message);
  console.log(error);
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ All checks passed!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

db.close();

