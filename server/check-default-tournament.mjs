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
  // בדוק אם יש טורניר עם ID "default"
  const defaultTournament = db.prepare(`
    SELECT * FROM tournaments WHERE id = 'default'
  `).get();

  if (defaultTournament) {
    console.log('🏆 טורניר ברירת מחדל נמצא:');
    console.log(`   ID: ${defaultTournament.id}`);
    console.log(`   Title: ${defaultTournament.title}`);
    console.log(`   Status: ${defaultTournament.registrationStatus}`);
    console.log(`   Capacity: ${defaultTournament.registrationCapacity}`);
    
    // בדוק רישומים לטורניר הזה
    const registrations = db.prepare(`
      SELECT tr.state, tr.createdAt, u.email, u.psnUsername, u.role
      FROM tournament_registrations tr
      JOIN users u ON u.id = tr.userId
      WHERE tr.tournamentId = 'default'
      ORDER BY tr.createdAt DESC
    `).all();
    
    console.log(`   📝 רישומים לטורניר ברירת מחדל (${registrations.length}):`);
    for (const reg of registrations) {
      console.log(`     - ${reg.email} (${reg.psnUsername || 'ללא PSN'}) - ${reg.state} - ${reg.createdAt}`);
    }
  } else {
    console.log('❌ טורניר ברירת מחדל לא נמצא');
  }

  // בדוק את כל הרישומים
  const allRegistrations = db.prepare(`
    SELECT tr.*, u.email, u.psnUsername, u.role, t.title as tournamentTitle
    FROM tournament_registrations tr
    JOIN users u ON u.id = tr.userId
    LEFT JOIN tournaments t ON t.id = tr.tournamentId
    ORDER BY tr.createdAt DESC
  `).all();

  console.log('\n📊 סה"כ רישומים במערכת:', allRegistrations.length);
  for (const reg of allRegistrations) {
    console.log(`   - ${reg.email} -> ${reg.tournamentTitle || 'טורניר לא נמצא'} (${reg.state}) - ${reg.createdAt}`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
