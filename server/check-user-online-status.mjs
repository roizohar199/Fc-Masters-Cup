#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tournaments.sqlite');

console.log('🔧 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // בדוק את פרטי המשתמש
  const user = db.prepare(`
    SELECT id, email, psnUsername, role, status, approvalStatus, isSuperAdmin, createdAt
    FROM users 
    WHERE email = 'roizohar111@gmail.com'
  `).get();

  if (user) {
    console.log('👤 פרטי המשתמש:');
    console.log(`   Email: ${user.email}`);
    console.log(`   PSN: ${user.psnUsername || 'ללא'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Approval Status: ${user.approvalStatus}`);
    console.log(`   Super Admin: ${user.isSuperAdmin === 1 ? 'כן' : 'לא'}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   ID: ${user.id}`);
  } else {
    console.log('❌ המשתמש לא נמצא במסד הנתונים');
  }

  // בדוק אם יש נתונים במערכת הנוכחות (אם יש טבלה כזו)
  try {
    const presenceData = db.prepare(`
      SELECT * FROM presence_data 
      WHERE userId = ? OR userEmail = ?
      ORDER BY lastSeen DESC
      LIMIT 5
    `).all(user?.id || '', 'roizohar111@gmail.com');
    
    if (presenceData.length > 0) {
      console.log('\n📡 נתוני נוכחות:');
      for (const presence of presenceData) {
        console.log(`   Last Seen: ${presence.lastSeen || 'לא ידוע'}`);
        console.log(`   Connections: ${presence.connections || 0}`);
        console.log(`   Is Online: ${presence.isOnline ? 'כן' : 'לא'}`);
      }
    } else {
      console.log('\n📡 אין נתוני נוכחות במסד הנתונים');
    }
  } catch (error) {
    console.log('\n📡 טבלת נוכחות לא קיימת או שגיאה:', error.message);
  }

  // בדוק אם יש טבלאות אחרות שמכילות נתוני נוכחות
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%presence%' OR name LIKE '%online%' OR name LIKE '%connection%'
  `).all();
  
  console.log('\n🗂️ טבלאות נוכחות זמינות:');
  for (const table of tables) {
    console.log(`   - ${table.name}`);
  }

  // בדוק את כל הטבלאות במסד הנתונים
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all();
  
  console.log('\n📊 כל הטבלאות במסד הנתונים:');
  for (const table of allTables) {
    console.log(`   - ${table.name}`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
