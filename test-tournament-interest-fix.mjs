// 🧪 בדיקת תיקון מערכת הבעת עניין בטורניר
// סקריפט זה בודק שהפאנל הניהול מציג נכון את הבעות העניין

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8787';

async function testTournamentInterestSystem() {
  console.log('🧪 בודק מערכת הבעת עניין בטורניר...\n');

  try {
    // 1. בדיקת endpoint של admin tournament registrations
    console.log('1️⃣ בודק /api/admin/tournament-registrations...');
    const response = await fetch(`${BASE_URL}/api/admin/tournament-registrations`);
    
    if (!response.ok) {
      console.log(`❌ שגיאה: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ תשובה התקבלה:', JSON.stringify(data, null, 2));
    
    // 2. בדיקת נתונים
    if (data.ok) {
      console.log('\n📊 ניתוח הנתונים:');
      console.log(`- טורניר: ${data.tournament?.title || 'לא נמצא'}`);
      console.log(`- סטטוס: ${data.tournament?.registrationStatus || 'לא ידוע'}`);
      console.log(`- קיבולת: ${data.tournament?.registrationCapacity || 0}`);
      console.log(`- מינימום: ${data.tournament?.registrationMinPlayers || 0}`);
      console.log(`- נרשמים: ${data.totalRegistrations || 0}`);
      
      if (data.registrations && data.registrations.length > 0) {
        console.log('\n👥 רשימת נרשמים:');
        data.registrations.forEach((reg, index) => {
          console.log(`  ${index + 1}. ${reg.psnUsername || reg.email} (${reg.email}) - ${reg.createdAt}`);
        });
      } else {
        console.log('\n😔 אין נרשמים עדיין');
      }
    } else {
      console.log('❌ התשובה לא תקינה:', data);
    }
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקה:', error.message);
  }
}

// הרץ את הבדיקה
testTournamentInterestSystem();
