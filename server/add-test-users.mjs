import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';

const db = new Database('./server/tournaments.sqlite');

console.log('➕ מוסיף משתמשי בדיקה למסד הנתונים...');

// רשימת משתמשי בדיקה
const testUsers = [
  { email: 'player1@test.com', psn: 'TestPlayer1', role: 'player' },
  { email: 'player2@test.com', psn: 'TestPlayer2', role: 'player' },
  { email: 'player3@test.com', psn: 'TestPlayer3', role: 'player' },
  { email: 'player4@test.com', psn: 'TestPlayer4', role: 'player' },
  { email: 'player5@test.com', psn: 'TestPlayer5', role: 'player' },
  { email: 'player6@test.com', psn: 'TestPlayer6', role: 'player' },
  { email: 'player7@test.com', psn: 'TestPlayer7', role: 'player' },
  { email: 'player8@test.com', psn: 'TestPlayer8', role: 'player' },
  { email: 'player9@test.com', psn: 'TestPlayer9', role: 'player' },
  { email: 'player10@test.com', psn: 'TestPlayer10', role: 'player' },
  { email: 'player11@test.com', psn: 'TestPlayer11', role: 'player' },
  { email: 'player12@test.com', psn: 'TestPlayer12', role: 'player' },
  { email: 'player13@test.com', psn: 'TestPlayer13', role: 'player' },
  { email: 'player14@test.com', psn: 'TestPlayer14', role: 'player' },
  { email: 'player15@test.com', psn: 'TestPlayer15', role: 'player' },
  { email: 'player16@test.com', psn: 'TestPlayer16', role: 'player' },
  { email: 'player17@test.com', psn: 'TestPlayer17', role: 'player' },
  { email: 'player18@test.com', psn: 'TestPlayer18', role: 'player' },
];

async function addTestUsers() {
  const defaultPassword = 'TestPassword123!';
  const hashedPassword = await argon2.hash(defaultPassword);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, createdAt, status, psnUsername, approvalStatus, display_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let addedCount = 0;

  for (const user of testUsers) {
    try {
      // בדיקה אם המשתמש כבר קיים
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
      if (existing) {
        console.log(`⏭️  משתמש ${user.email} כבר קיים, מדלג...`);
        continue;
      }

      const userId = randomUUID();
      insertUser.run(
        userId,
        user.email,
        hashedPassword,
        user.role,
        new Date().toISOString(),
        'active',
        user.psn,
        'approved',
        user.psn
      );
      
      console.log(`✅ נוסף: ${user.email} (PSN: ${user.psn})`);
      addedCount++;
    } catch (error) {
      console.log(`❌ שגיאה בהוספת ${user.email}:`, error.message);
    }
  }

  console.log(`\n🎉 הושלם! נוספו ${addedCount} משתמשים חדשים.`);
  
  // הצגת סך המשתמשים
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`👥 סך המשתמשים במסד הנתונים: ${totalUsers.count}`);
}

addTestUsers().then(() => {
  db.close();
}).catch((error) => {
  console.error('❌ שגיאה כללית:', error);
  db.close();
});
