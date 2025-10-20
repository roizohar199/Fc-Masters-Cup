#!/usr/bin/env node

try {
  const response = await fetch('http://localhost:8787/api/admin/tournament-registrations');
  if (response.ok) {
    const data = await response.json();
    console.log('✅ API עובד!');
    console.log('📊 נתונים:', JSON.stringify(data, null, 2));
  } else {
    console.log(`❌ שגיאה ב-API: ${response.status} ${response.statusText}`);
  }
} catch (error) {
  console.log(`❌ שגיאה בחיבור: ${error.message}`);
}