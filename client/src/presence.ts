let ws: WebSocket | null = null;
let hbIv: any = null;
let activityTimeout: any = null;

const listeners: Array<(users: any[])=>void> = [];
function emit(users: any[]) { listeners.forEach(fn => fn(users)); }
export function onPresenceUpdate(cb: (users: any[])=>void) { 
  listeners.push(cb); 
  return () => {
    const i = listeners.indexOf(cb); 
    if (i>=0) listeners.splice(i,1);
  }; 
}

// פונקציה לשליחת פעילות
function sendActivity() {
  try { 
    ws?.send(JSON.stringify({ type: "heartbeat", activity: true })); 
    console.log("🎯 Activity sent to server");
  } catch {} 
}

// פונקציה לשליחת heartbeat רגיל (ללא פעילות)
function sendHeartbeat() {
  try { 
    ws?.send(JSON.stringify({ type: "heartbeat", activity: false })); 
  } catch {} 
}

// פונקציה לזיהוי פעילות משתמש
function detectActivity() {
  // נקה timeout קודם
  if (activityTimeout) {
    clearTimeout(activityTimeout);
  }
  
  // שלח פעילות
  sendActivity();
  
  // הגדר timeout לפעילות הבאה (למניעת spam)
  activityTimeout = setTimeout(() => {
    // אפשר לשלוח פעילות שוב
  }, 5000); // 5 שניות בין פעילויות
}

export function startPresence() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  // קביעת URL דינמי על בסיס הסביבה
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  const port = import.meta.env.DEV ? "8787" : window.location.port;
  
  // תיקון: אם אנחנו ב-production, לא נוסיף פורט
  let wsUrl;
  if (import.meta.env.DEV) {
    wsUrl = `${protocol}//${host}:${port}/presence`;
  } else {
    // ב-production, השתמש באותו host ללא פורט
    wsUrl = `${protocol}//${host}/presence`;
  }
  
  console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("✅ WebSocket connected successfully");
    clearInterval(hbIv);
    // heartbeat תקופתי - רק חיבור, ללא פעילות
    hbIv = setInterval(() => sendHeartbeat(), 20000);
    // מיידי - שלח פעילות בחיבור
    sendActivity();
    
    // הגדרת זיהוי פעילות משתמש
    setupActivityDetection();
  };

  ws.onmessage = ev => {
    try {
      const m = JSON.parse(String(ev.data));
      console.log("📨 WebSocket message received:", m);
      if (m?.type === "presence:update") {
        console.log("👥 Presence update:", m.users?.length || 0, "users");
        emit(m.users || []);
      }
      if (m?.type === "presence:hello") {
        console.log("👋 Presence hello:", m.users?.length || 0, "users");
        emit(m.users || []);
      }
    } catch (e) {
      console.error("❌ Error parsing WebSocket message:", e);
    }
  };

  ws.onclose = (event) => { 
    console.log("❌ WebSocket closed:", event.code, event.reason);
    
    // הסברים מפורטים לשגיאות נפוצות
    if (event.code === 1006) {
      console.error("💡 שגיאה 1006: בעיה בחיבור WebSocket. אפשרויות:");
      console.error("   1. הבדוק ש-Nginx מוגדר עם SSL + WebSocket headers");
      console.error("   2. ודא שהשרת Backend רץ (pm2 status)");
      console.error("   3. בדוק את CORS_ORIGIN ב-.env");
    } else if (event.code === 4401) {
      console.error("💡 שגיאה 4401: Authentication נכשל - צריך להתחבר שוב");
    } else if (event.code === 1000) {
      console.log("✅ חיבור נסגר בהצלחה (נורמלי)");
    }
    
    clearInterval(hbIv); 
    hbIv = null; 
    clearTimeout(activityTimeout);
    activityTimeout = null;
    
    // ננסה להתחבר שוב רק אם זה לא סגירה נורמלית
    if (event.code !== 1000) {
      console.log("🔄 ננסה להתחבר שוב בעוד 3 שניות...");
      setTimeout(startPresence, 3000);
    }
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
    console.error("💡 עצות לפתרון בעיות:");
    console.error("   1. בדוק שהאתר רץ על HTTPS (אם כן, WebSocket חייב להיות WSS)");
    console.error("   2. בדוק ש-Nginx מוגדר נכון עם SSL Certificate");
    console.error("   3. בדוק שהשרת Backend רץ על Port 8787");
    console.error("   4. ראה מדריך מפורט: README-תיקון-WebSocket.md");
  };
}

// הגדרת זיהוי פעילות משתמש
function setupActivityDetection() {
  // זיהוי פעילות בעכבר
  document.addEventListener('mousemove', detectActivity, { passive: true });
  document.addEventListener('mousedown', detectActivity, { passive: true });
  document.addEventListener('mouseup', detectActivity, { passive: true });
  
  // זיהוי פעילות במקלדת
  document.addEventListener('keydown', detectActivity, { passive: true });
  document.addEventListener('keyup', detectActivity, { passive: true });
  
  // זיהוי פעילות בגלילה
  document.addEventListener('scroll', detectActivity, { passive: true });
  
  // זיהוי פעילות בלחיצה על אלמנטים
  document.addEventListener('click', detectActivity, { passive: true });
  
  // זיהוי פעילות בפוקוס
  window.addEventListener('focus', detectActivity, { passive: true });
}

export function stopPresence() {
  try { ws?.close(); } catch {}
  clearInterval(hbIv); 
  hbIv = null;
  clearTimeout(activityTimeout);
  activityTimeout = null;
}