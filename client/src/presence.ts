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
  const wsUrl = port ? `${protocol}//${host}:${port}/presence` : `${protocol}//${host}/presence`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
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
      if (m?.type === "presence:update") emit(m.users || []);
      if (m?.type === "presence:hello") emit(m.users || []);
    } catch {}
  };

  ws.onclose = () => { 
    clearInterval(hbIv); 
    hbIv = null; 
    clearTimeout(activityTimeout);
    activityTimeout = null;
    setTimeout(startPresence, 3000); 
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