import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'tournaments.sqlite');
const db = new Database(dbPath);

console.log('🔧 Database path:', dbPath);

try {
  // בדוק כמה הרשמות יש בטורניר הישן
  const oldRegistrations = db.prepare('SELECT COUNT(*) as count FROM tournament_registrations WHERE tournamentId = ?').get('7a913976-841a-4a67-9d74-be504ca0c379');
  console.log('📊 הרשמות בטורניר הישן:', oldRegistrations.count);

  // העבר את ההרשמות לטורניר ברירת המחדל
  const result = db.prepare('UPDATE tournament_registrations SET tournamentId = ? WHERE tournamentId = ?').run('default', '7a913976-841a-4a67-9d74-be504ca0c379');
  console.log('✅ הועברו הרשמות:', result.changes);

  // בדוק את התוצאה
  const newRegistrations = db.prepare('SELECT COUNT(*) as count FROM tournament_registrations WHERE tournamentId = ?').get('default');
  console.log('📊 הרשמות בטורניר ברירת המחדל:', newRegistrations.count);

  // הצג את כל ההרשמות
  const allRegistrations = db.prepare(`
    SELECT tr.*, u.email, u.psnUsername 
    FROM tournament_registrations tr 
    JOIN users u ON u.id = tr.userId 
    ORDER BY tr.createdAt DESC
  `).all();

  console.log('\n🏆 כל ההרשמות במערכת:');
  allRegistrations.forEach(reg => {
    console.log(`   - ${reg.email} (${reg.psnUsername || 'No PSN'}) -> ${reg.tournamentId} (${reg.state}) - ${reg.createdAt}`);
  });

} catch (error) {
  console.error('❌ שגיאה:', error);
} finally {
  db.close();
}
