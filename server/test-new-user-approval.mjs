#!/usr/bin/env node

import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tournaments.sqlite');

console.log('🔧 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // בדוק כמה בקשות ממתינות יש עכשיו
  const pendingRequestsCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM approval_requests 
    WHERE status = 'pending'
  `).get();

  console.log(`📊 סה"כ בקשות ממתינות: ${pendingRequestsCount.count}`);

  // בדוק כמה משתמשים ממתינים לאישור
  const pendingUsersCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE approvalStatus = 'pending'
  `).get();

  console.log(`👤 סה"כ משתמשים ממתינים לאישור: ${pendingUsersCount.count}`);

  // הצג את הבקשות הממתינות
  const pendingRequests = db.prepare(`
    SELECT actionType, targetUserEmail, createdAt
    FROM approval_requests 
    WHERE status = 'pending'
    ORDER BY createdAt DESC
    LIMIT 5
  `).all();

  console.log('\n📋 הבקשות הממתינות האחרונות:');
  for (const req of pendingRequests) {
    console.log(`   - ${req.actionType} עבור ${req.targetUserEmail} (${req.createdAt})`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
