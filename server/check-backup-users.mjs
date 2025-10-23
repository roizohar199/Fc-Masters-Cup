import Database from 'better-sqlite3';

const db = new Database('../backups/backup-2025-10-18T08-17-46.sqlite');

console.log('🔍 בודק משתמשים בגיבוי...');

const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log('📊 סה"כ משתמשים בגיבוי:', count.count);

const users = db.prepare('SELECT email, role, status FROM users ORDER BY createdAt DESC LIMIT 10').all();
console.log('📋 משתמשים אחרונים בגיבוי:');
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.email} (${user.role}, ${user.status})`);
});

db.close();
