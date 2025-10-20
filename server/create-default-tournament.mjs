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
  // בדוק אם יש כבר טורניר ברירת מחדל
  const existingTournament = db.prepare(`
    SELECT * FROM tournaments WHERE id = 'default'
  `).get();

  if (existingTournament) {
    console.log('✅ טורניר ברירת מחדל כבר קיים:');
    console.log(`   Title: ${existingTournament.title}`);
    console.log(`   Status: ${existingTournament.registrationStatus}`);
    console.log(`   Capacity: ${existingTournament.registrationCapacity}`);
  } else {
    console.log('🔧 יוצר טורניר ברירת מחדל...');
    
    // יצירת טורניר ברירת מחדל
    const tournamentId = 'default';
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO tournaments 
      (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond, registrationStatus, registrationCapacity, registrationMinPlayers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tournamentId,
      "טורניר שישי בערב",
      "FIFA 24",
      "PS5",
      "Asia/Jerusalem",
      now,
      500,
      0,
      "collecting", // פתוח לרישום
      100,
      16
    );
    
    console.log('✅ טורניר ברירת מחדל נוצר בהצלחה!');
    console.log(`   ID: ${tournamentId}`);
    console.log(`   Title: טורניר שישי בערב`);
    console.log(`   Status: collecting (פתוח לרישום)`);
    console.log(`   Capacity: 100`);
    console.log(`   Min Players: 16`);
  }

  // בדוק את כל הטורנירים
  const tournaments = db.prepare(`
    SELECT id, title, registrationStatus, registrationCapacity, createdAt
    FROM tournaments 
    ORDER BY createdAt DESC
  `).all();

  console.log('\n🏆 כל הטורנירים במערכת:');
  for (const tournament of tournaments) {
    console.log(`   - ${tournament.title} (${tournament.id})`);
    console.log(`     Status: ${tournament.registrationStatus}`);
    console.log(`     Capacity: ${tournament.registrationCapacity}`);
    console.log(`     Created: ${tournament.createdAt}`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
