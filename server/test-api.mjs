import Database from 'better-sqlite3';

const db = new Database('tournaments.sqlite');

console.log('🔍 בודק API של משתמשים...');

// סימולציה של ה-API
const users = db.prepare(`SELECT id, email, role, secondPrizeCredit, createdAt, status, psnUsername FROM users ORDER BY createdAt DESC`).all();

console.log('📋 תגובת API:');
console.log(JSON.stringify(users, null, 2));

// בדיקת פורמט התאריך
users.forEach((user, index) => {
  console.log(`\n${index + 1}. ${user.email}:`);
  console.log(`   - CreatedAt: ${user.createdAt}`);
  console.log(`   - Date object: ${new Date(user.createdAt)}`);
  console.log(`   - Is valid: ${!isNaN(new Date(user.createdAt).getTime())}`);
  console.log(`   - Hebrew format: ${new Date(user.createdAt).toLocaleDateString("he-IL")}`);
  console.log(`   - Credit: ${user.secondPrizeCredit}`);
});

db.close();
