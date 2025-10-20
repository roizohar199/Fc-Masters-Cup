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
  // בדוק את הטורנירים
  const tournaments = db.prepare(`
    SELECT id, title, registrationStatus, registrationCapacity, createdAt
    FROM tournaments 
    ORDER BY createdAt DESC
  `).all();

  console.log('🏆 טורנירים במסד הנתונים:');
  for (const tournament of tournaments) {
    console.log(`   - ${tournament.title} (${tournament.id})`);
    console.log(`     Status: ${tournament.registrationStatus}`);
    console.log(`     Capacity: ${tournament.registrationCapacity}`);
    console.log(`     Created: ${tournament.createdAt}`);
    
    // בדוק רישומים לטורניר זה
    const registrations = db.prepare(`
      SELECT tr.state, tr.createdAt, u.email, u.psnUsername, u.role
      FROM tournament_registrations tr
      JOIN users u ON u.id = tr.userId
      WHERE tr.tournamentId = ?
      ORDER BY tr.createdAt DESC
    `).all(tournament.id);
    
    console.log(`     📝 רישומים (${registrations.length}):`);
    for (const reg of registrations) {
      console.log(`       - ${reg.email} (${reg.psnUsername || 'ללא PSN'}) - ${reg.state} - ${reg.createdAt}`);
    }
    console.log('');
  }

  // בדוק את כל הרישומים
  const allRegistrations = db.prepare(`
    SELECT tr.*, u.email, u.psnUsername, u.role, t.title as tournamentTitle
    FROM tournament_registrations tr
    JOIN users u ON u.id = tr.userId
    JOIN tournaments t ON t.id = tr.tournamentId
    ORDER BY tr.createdAt DESC
  `).all();

  console.log('📊 סה"כ רישומים במערכת:', allRegistrations.length);
  for (const reg of allRegistrations) {
    console.log(`   - ${reg.email} -> ${reg.tournamentTitle} (${reg.state}) - ${reg.createdAt}`);
  }

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
