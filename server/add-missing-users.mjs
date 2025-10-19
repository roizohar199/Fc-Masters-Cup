import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';

const db = new Database('./tournaments.sqlite');

console.log('🔧 מוסיף משתמשים חסרים...');

try {
  // הוספת yosiyoviv@gmail.com
  const yosiId = randomUUID();
  const yosiPassword = bcrypt.hashSync('password123', 10);
  const yosiDate = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, status, createdAt, secondPrizeCredit, psnUsername, approvalStatus, isSuperAdmin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(yosiId, 'yosiyoviv@gmail.com', yosiPassword, 'admin', 'active', yosiDate, 60, 'Yosi', 'approved', 0);
  
  console.log('✅ הוספתי: yosiyoviv@gmail.com');

  // הוספת lehaka71@gmail.com
  const lehakaId = randomUUID();
  const lehakaPassword = bcrypt.hashSync('password123', 10);
  const lehakaDate = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, status, createdAt, secondPrizeCredit, psnUsername, approvalStatus, isSuperAdmin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(lehakaId, 'lehaka71@gmail.com', lehakaPassword, 'player', 'active', lehakaDate, 0, 'Lehaka71', 'approved', 0);
  
  console.log('✅ הוספתי: lehaka71@gmail.com');

  // בדיקה
  const users = db.prepare('SELECT email, role, secondPrizeCredit, psnUsername FROM users').all();
  console.log('\n📋 כל המשתמשים:');
  users.forEach((u, i) => {
    console.log(`${i+1}. ${u.email} (${u.role}) - ${u.secondPrizeCredit}₪ - PSN: ${u.psnUsername}`);
  });

} catch (error) {
  console.error('❌ שגיאה:', error.message);
}

db.close();
console.log('\n✅ סיים!');
