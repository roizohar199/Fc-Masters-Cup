#!/usr/bin/env node
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const email = process.argv[2] || "yosiyoviv@gmail.com";

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 Checking both DB files for:", email);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// DB 1: server/tournaments.sqlite (נכון)
console.log("1️⃣ DB: server/tournaments.sqlite");
try {
  const db1 = new Database(path.join(__dirname, "tournaments.sqlite"));
  const user1 = db1.prepare(`SELECT id, email, status FROM users WHERE email=?`).get(email);
  if (user1) {
    console.log("   ✅ User FOUND!");
    console.log("     ID:", user1.id);
    console.log("     Status:", user1.status);
  } else {
    console.log("   ❌ User NOT found");
  }
  db1.close();
} catch (error) {
  console.log("   ❌ Error:", error.message);
}
console.log();

// DB 2: server/server/tournaments.sqlite (מיותר)
console.log("2️⃣ DB: server/server/tournaments.sqlite");
try {
  const db2 = new Database(path.join(__dirname, "server", "tournaments.sqlite"));
  const user2 = db2.prepare(`SELECT id, email, status FROM users WHERE email=?`).get(email);
  if (user2) {
    console.log("   ✅ User FOUND!");
    console.log("     ID:", user2.id);
    console.log("     Status:", user2.status);
  } else {
    console.log("   ❌ User NOT found");
  }
  db2.close();
} catch (error) {
  console.log("   ❌ Error:", error.message);
}
console.log();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("💡 הבעיה:");
console.log("   אם המשתמש נמצא רק ב-DB אחד,");
console.log("   זה אומר שהקוד משתמש ב-2 DBs שונים!");
console.log();
console.log("💡 הפתרון:");
console.log("   1. מחק את server/server/ (התיקייה כולה)");
console.log("   2. הרץ: fix-project-structure.ps1");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

