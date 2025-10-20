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
  // מצא משתמשים שממתינים לאישור אבל אין להם בקשה בטבלת approval_requests
  const pendingUsers = db.prepare(`
    SELECT u.id, u.email, u.psnUsername, u.createdAt, u.approvalToken
    FROM users u
    WHERE u.approvalStatus = 'pending'
    AND u.id NOT IN (
      SELECT targetUserId FROM approval_requests 
      WHERE actionType = 'approve-user' AND status = 'pending'
    )
  `).all();

  console.log(`📋 נמצאו ${pendingUsers.length} משתמשים שממתינים לאישור ללא בקשה:`);
  
  for (const user of pendingUsers) {
    console.log(`👤 ${user.email} (${user.psnUsername || 'ללא שם PSN'})`);
  }

  if (pendingUsers.length > 0) {
    console.log('\n🔧 יוצר בקשות אישור חסרות...');
    
    for (const user of pendingUsers) {
      const requestId = randomUUID();
      
      db.prepare(`
        INSERT INTO approval_requests (id, requesterId, requesterEmail, actionType, targetUserId, targetUserEmail, actionData, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        requestId,
        'system', // מזהה מיוחד למערכת
        'system@fcmasterscup.com',
        'approve-user',
        user.id,
        user.email,
        JSON.stringify({ 
          psnUsername: user.psnUsername,
          approvalToken: user.approvalToken,
          registrationDate: user.createdAt
        }),
        new Date().toISOString()
      );
      
      console.log(`✅ נוצרה בקשה עבור ${user.email}`);
    }
    
    console.log(`\n🎉 הושלם! נוצרו ${pendingUsers.length} בקשות אישור.`);
  } else {
    console.log('✅ כל המשתמשים שממתינים לאישור כבר יש להם בקשות פעילות.');
  }

  // בדיקה סופית - כמה בקשות ממתינות יש עכשיו
  const pendingRequestsCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM approval_requests 
    WHERE status = 'pending'
  `).get();

  console.log(`\n📊 סה"כ בקשות ממתינות עכשיו: ${pendingRequestsCount.count}`);

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
