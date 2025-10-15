import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// פתח את בסיס הנתונים ישירות מהתיקייה הראשית
const dbPath = path.join(__dirname, 'server', 'tournaments.sqlite');

// טען את better-sqlite3 מהתיקייה הנכונה
const { default: Database } = await import('./server/node_modules/better-sqlite3/index.js');
const db = new Database(dbPath);

console.log('🔍 בודק משתמשים במסד הנתונים...');

// הצג את כל המשתמשים
const users = db.prepare('SELECT id, email, role FROM users').all();
console.log('📋 משתמשים קיימים:');
users.forEach(user => {
  console.log(`  - ${user.email} (${user.role})`);
});

// מחק את המשתמש admin@fcmasters.cup
const emailToDelete = 'admin@fcmasters.cup';
const result = db.prepare('DELETE FROM users WHERE email = ?').run(emailToDelete);

if (result.changes > 0) {
  console.log(`✅ נמחקו ${result.changes} משתמשים עם המייל: ${emailToDelete}`);
} else {
  console.log(`❌ לא נמצא משתמש עם המייל: ${emailToDelete}`);
}

// הצג את המשתמשים שנשארו
console.log('\n📋 משתמשים שנשארו:');
const remainingUsers = db.prepare('SELECT id, email, role FROM users').all();
remainingUsers.forEach(user => {
  console.log(`  - ${user.email} (${user.role})`);
});

db.close();
console.log('\n🎉 הפעולה הושלמה!');
