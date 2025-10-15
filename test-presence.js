// טסט סימולציה למערכת Presence
import WebSocket from 'ws';

console.log('🧪 מתחיל טסט סימולציה למערכת Presence...\n');

// פונקציה ליצירת WebSocket connection
function createConnection(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8787/presence', {
      headers: {
        'Cookie': 'session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYzMzYzNjAwMH0.test'
      }
    });

    ws.on('open', () => {
      console.log(`✅ ${name} התחבר בהצלחה`);
      resolve(ws);
    });

    ws.on('error', (error) => {
      console.log(`❌ ${name} שגיאה בחיבור:`, error.message);
      reject(error);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'presence:update') {
        console.log(`📊 ${name} קיבל עדכון:`, message.users.length, 'משתמשים מחוברים');
        message.users.forEach(user => {
          console.log(`   👤 ${user.email} (${new Date(user.lastSeen).toLocaleTimeString()})`);
        });
      }
    });
  });
}

// פונקציה לשליחת heartbeat
function sendHeartbeat(ws, name) {
  setInterval(() => {
    try {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
      console.log(`💓 ${name} שלח heartbeat`);
    } catch (error) {
      console.log(`❌ ${name} שגיאה בשליחת heartbeat:`, error.message);
    }
  }, 20000); // כל 20 שניות
}

// פונקציה לסגירת חיבור
function closeConnection(ws, name, delay) {
  setTimeout(() => {
    console.log(`🔌 ${name} סוגר חיבור...`);
    ws.close();
  }, delay);
}

async function runTest() {
  try {
    console.log('1️⃣ יוצר חיבור ראשון...');
    const ws1 = await createConnection('משתמש 1');
    sendHeartbeat(ws1, 'משתמש 1');

    console.log('\n2️⃣ יוצר חיבור שני...');
    const ws2 = await createConnection('משתמש 2');
    sendHeartbeat(ws2, 'משתמש 2');

    console.log('\n3️⃣ מחכה 30 שניות...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n4️⃣ סוגר חיבור ראשון...');
    closeConnection(ws1, 'משתמש 1', 0);

    console.log('\n5️⃣ מחכה 80 שניות כדי לראות שינוי סטטוס...');
    await new Promise(resolve => setTimeout(resolve, 80000));

    console.log('\n6️⃣ סוגר חיבור שני...');
    closeConnection(ws2, 'משתמש 2', 0);

    console.log('\n✅ טסט הושלם!');
    
  } catch (error) {
    console.error('❌ שגיאה בטסט:', error);
  }
}

// הרצת הטסט
runTest();
