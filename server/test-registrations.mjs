#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tournaments.sqlite');

console.log('🔧 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // מצא משתמשים שחקנים
  const players = db.prepare(`
    SELECT id, email, psnUsername 
    FROM users 
    WHERE role = 'player' AND status = 'active'
    LIMIT 5
  `).all();

  console.log('👥 משתמשים שחקנים:', players.length);
  for (const player of players) {
    console.log(`   - ${player.email} (${player.psnUsername || 'ללא PSN'})`);
  }

  if (players.length === 0) {
    console.log('⚠️ אין משתמשים שחקנים במערכת');
    process.exit(0);
  }

  // רשום 2 שחקנים לטורניר ברירת מחדל
  const tournamentId = 'default';
  const now = new Date().toISOString();
  
  console.log('\n🏆 רושם שחקנים לטורניר ברירת מחדל...');
  
  for (let i = 0; i < Math.min(2, players.length); i++) {
    const player = players[i];
    
    // בדוק אם כבר רשום
    const existing = db.prepare(`
      SELECT * FROM tournament_registrations 
      WHERE tournamentId = ? AND userId = ?
    `).get(tournamentId, player.id);
    
    if (existing) {
      console.log(`   ⚠️ ${player.email} כבר רשום לטורניר`);
      continue;
    }
    
    // רשום את השחקן
    const registrationId = randomUUID();
    db.prepare(`
      INSERT INTO tournament_registrations 
      (id, tournamentId, userId, state, createdAt, updatedAt)
      VALUES (?, ?, ?, 'registered', ?, ?)
    `).run(registrationId, tournamentId, player.id, now, now);
    
    console.log(`   ✅ ${player.email} נרשם בהצלחה לטורניר`);
  }

  // בדוק את הרישומים
  const registrations = db.prepare(`
    SELECT tr.*, u.email, u.psnUsername
    FROM tournament_registrations tr
    JOIN users u ON u.id = tr.userId
    WHERE tr.tournamentId = ? AND tr.state = 'registered'
    ORDER BY tr.createdAt DESC
  `).all(tournamentId);

  console.log(`\n📝 רישומים לטורניר ברירת מחדל (${registrations.length}):`);
  for (const reg of registrations) {
    console.log(`   - ${reg.email} (${reg.psnUsername || 'ללא PSN'}) - ${reg.createdAt}`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
