import Database from 'better-sqlite3';

const db = new Database('./tournaments.sqlite');

console.log('🔍 בודק משתמשים במסד הנתונים...');

const users = db.prepare(`SELECT id, email, role, secondPrizeCredit, createdAt, status, psnUsername FROM users ORDER BY createdAt DESC`).all();

console.log('📋 משתמשים במסד הנתונים:');
users.forEach((user, index) => {
  console.log(`\n${index + 1}. ${user.email}:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Role: ${user.role}`);
  console.log(`   - Credit: ${user.secondPrizeCredit}`);
  console.log(`   - CreatedAt: ${user.createdAt}`);
  console.log(`   - Status: ${user.status}`);
  console.log(`   - PSN: ${user.psnUsername || 'N/A'}`);
});

db.close();
