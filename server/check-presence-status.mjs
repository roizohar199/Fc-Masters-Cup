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

  // בדוק את ה-API של נוכחות
  console.log('\n🌐 בודק API נוכחות...');
  
  try {
    const response = await fetch('http://localhost:8787/api/presence/all-users');
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 סה"כ משתמשים במערכת נוכחות: ${data.length}`);
      
      const targetUser = data.find(u => u.email === 'roizohar111@gmail.com');
      if (targetUser) {
        console.log('\n👤 סטטוס נוכחות של המשתמש:');
        console.log(`   מייל: ${targetUser.email}`);
        console.log(`   אונליין: ${targetUser.isOnline ? 'כן' : 'לא'}`);
        console.log(`   פעיל: ${targetUser.isActive ? 'כן' : 'לא'}`);
        console.log(`   חיבורים: ${targetUser.connections}`);
        console.log(`   נראה לאחרונה: ${targetUser.lastSeen ? new Date(targetUser.lastSeen).toLocaleString('he-IL') : 'לא ידוע'}`);
        console.log(`   תפקיד: ${targetUser.role}`);
        console.log(`   מנהל על: ${targetUser.isSuperAdmin ? 'כן' : 'לא'}`);
      } else {
        console.log('❌ המשתמש לא נמצא במערכת הנוכחות');
      }
      
      // הצג את כל המשתמשים האונליין
      const onlineUsers = data.filter(u => u.isOnline);
      console.log(`\n🟢 משתמשים אונליין (${onlineUsers.length}):`);
      for (const onlineUser of onlineUsers) {
        console.log(`   - ${onlineUser.email} (${onlineUser.role}) - חיבורים: ${onlineUser.connections}`);
      }
    } else {
      console.log(`❌ שגיאה ב-API נוכחות: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ שגיאה בחיבור ל-API: ${error.message}`);
    console.log('💡 ודא שהשרת פועל על פורט 3000');
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
