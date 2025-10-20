#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tournaments.sqlite');

const db = new Database(dbPath);

try {
  // בדוק את הסטטוס של המשתמש kerenavram47@gmail.com
  const user = db.prepare(`
    SELECT id, email, psnUsername, role, status, approvalStatus, approvalToken, createdAt
    FROM users 
    WHERE email = 'kerenavram47@gmail.com'
  `).get();

  if (user) {
    console.log('👤 פרטי המשתמש:');
    console.log(`   Email: ${user.email}`);
    console.log(`   PSN: ${user.psnUsername || 'ללא'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Approval Status: ${user.approvalStatus}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   ID: ${user.id}`);
    
    // בדוק אם יש בקשות עבור המשתמש הזה
    const requests = db.prepare(`
      SELECT id, actionType, status, createdAt
      FROM approval_requests 
      WHERE targetUserId = ? OR targetUserEmail = ?
    `).all(user.id, user.email);
    
    console.log(`\n📋 בקשות אישור עבור המשתמש:`);
    if (requests.length > 0) {
      for (const req of requests) {
        console.log(`   - ${req.actionType} (${req.status}) - ${req.createdAt}`);
      }
    } else {
      console.log('   אין בקשות אישור');
    }
    
  } else {
    console.log('❌ המשתמש לא נמצא במסד הנתונים');
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
