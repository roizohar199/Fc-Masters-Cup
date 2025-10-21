#!/usr/bin/env node

/**
 * בדיקת מערכת התראות מייל
 * בודק אם ההתראות נשלחות למנהל
 */

// טעינת משתני סביבה
import { config } from 'dotenv';
config({ path: './server/.env' });

import { sendAdminNotification, sendTournamentRegistrationEmail } from './server/dist/email.js';

console.log('🧪 בדיקת מערכת התראות מייל...\n');

// בדיקת התראה על משתמש חדש
console.log('1️⃣ בדיקת התראה על משתמש חדש...');
try {
  const result1 = await sendAdminNotification('fcmasters9@gmail.com', {
    email: 'test@example.com',
    psnUsername: 'TestUser',
    createdAt: new Date().toISOString()
  });
  console.log('✅ התראה על משתמש חדש:', result1 ? 'נשלחה' : 'נכשלה');
} catch (error) {
  console.log('❌ שגיאה בהתראה על משתמש חדש:', error.message);
}

console.log('\n2️⃣ בדיקת התראה על הרשמה לטורניר...');
try {
  const result2 = await sendTournamentRegistrationEmail({
    tournamentTitle: 'טורניר בדיקה',
    userName: 'TestUser',
    userEmail: 'test@example.com',
    count: 5,
    capacity: 16
  });
  console.log('✅ התראה על הרשמה לטורניר:', result2 ? 'נשלחה' : 'נכשלה');
} catch (error) {
  console.log('❌ שגיאה בהתראה על הרשמה לטורניר:', error.message);
}

console.log('\n🏁 בדיקה הושלמה!');
