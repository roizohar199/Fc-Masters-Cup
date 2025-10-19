import type { Server as HTTPServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { decodeToken } from "./auth.js";

type Conn = { 
  lastSeen: number; 
  lastActivity: number; // זמן הפעילות האחרונה
  isConnected: boolean; // האם החיבור פעיל
};
type UserPresence = {
  uid: string;
  email: string;
  conns: Map<string, Conn>; // connId -> Conn
  lastActivity: number; // זמן הפעילות האחרונה של המשתמש
  isOnline: boolean; // סטטוס אונליין עם Hysteresis
};

// הגדרות Hysteresis
const ONLINE_TTL_MS = 60_000; // 60 שניות - זמן מקסימלי להיות אונליין
const ACTIVITY_WINDOW_MS = 30_000; // 30 שניות - חלון פעילות
const HYSTERESIS_DELAY_MS = 10_000; // 10 שניות - עיכוב לפני הפיכה לאופליין

const users = new Map<string, UserPresence>(); // email -> presence
const recentLogins = new Map<string, number>(); // email -> last login timestamp

function uidConnId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// פונקציה לעדכון זמן login
export function updateUserLogin(email: string) {
  recentLogins.set(email, Date.now());
  console.log(`🔐 User login updated: ${email} at ${new Date().toLocaleTimeString()}`);
}

function parseCookie(header?: string) {
  const out: Record<string,string> = {};
  if (!header) return out;
  header.split(";").forEach(p => {
    const [k, ...rest] = p.trim().split("=");
    out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

function snapshot() {
  const now = Date.now();
  const result: Array<{uid:string;email:string;lastSeen:number;isOnline:boolean;isActive:boolean;connections:number}> = [];
  
  console.log(`🔍 Snapshot: Total users in memory: ${users.size}, recent logins: ${recentLogins.size}`);
  
  // עבד על משתמשים עם חיבורים פעילים
  for (const up of users.values()) {
    console.log(`🔍 Processing user: ${up.email}, total connections: ${up.conns.size}`);
    
    // לוגיקה פשוטה: אם יש חיבורים, המשתמש אונליין
    const hasConnections = up.conns.size > 0;
    const hasRecentActivity = (now - up.lastActivity) <= ACTIVITY_WINDOW_MS;
    
    console.log(`  hasConnections: ${hasConnections}, hasRecentActivity: ${hasRecentActivity}`);
    
    // אם יש חיבורים או פעילות אחרונה, המשתמש אונליין
    if (hasConnections || hasRecentActivity) {
      up.isOnline = true;
      console.log(`  ✅ Setting isOnline to true for ${up.email}`);
    } else {
      up.isOnline = false;
      console.log(`  ❌ Setting isOnline to false for ${up.email}`);
    }
    
    // נכלל את כל המשתמשים בתוצאה, לא רק אלו שאונליין
    const lastSeen = up.lastActivity;
    const isActive = hasRecentActivity;
    
    result.push({ 
      uid: up.uid, 
      email: up.email, 
      lastSeen, 
      isOnline: up.isOnline,
      isActive,
      connections: up.conns.size 
    });
    
    console.log(`📊 Snapshot: ${up.email} - isOnline=${up.isOnline}, isActive=${isActive}, connections=${up.conns.size}, lastActivity=${new Date(up.lastActivity).toLocaleTimeString()}`);
  }
  
  console.log(`📊 Snapshot result: ${result.length} users total (${result.filter(u => u.isOnline).length} online)`);
  return result;
}

// פונקציה חדשה שמחזירה את כל המשתמשים עם נתוני login
function snapshotWithLogins() {
  const now = Date.now();
  const result: Array<{uid:string;email:string;lastSeen:number;isOnline:boolean;isActive:boolean;connections:number}> = [];
  
  console.log(`🔍 Snapshot with logins: Total users in memory: ${users.size}, recent logins: ${recentLogins.size}`);
  
  // עבד על משתמשים עם חיבורים פעילים
  for (const up of users.values()) {
    console.log(`🔍 Processing user: ${up.email}, total connections: ${up.conns.size}`);
    
    // לוגיקה פשוטה: אם יש חיבורים, המשתמש אונליין
    const hasConnections = up.conns.size > 0;
    const hasRecentActivity = (now - up.lastActivity) <= ACTIVITY_WINDOW_MS;
    
    console.log(`  hasConnections: ${hasConnections}, hasRecentActivity: ${hasRecentActivity}`);
    
    // אם יש חיבורים או פעילות אחרונה, המשתמש אונליין
    if (hasConnections || hasRecentActivity) {
      up.isOnline = true;
      console.log(`  ✅ Setting isOnline to true for ${up.email}`);
    } else {
      up.isOnline = false;
      console.log(`  ❌ Setting isOnline to false for ${up.email}`);
    }
    
    // נכלל את כל המשתמשים בתוצאה, לא רק אלו שאונליין
    const lastSeen = up.lastActivity;
    const isActive = hasRecentActivity;
    
    result.push({ 
      uid: up.uid, 
      email: up.email, 
      lastSeen, 
      isOnline: up.isOnline,
      isActive,
      connections: up.conns.size 
    });
    
    console.log(`📊 Snapshot: ${up.email} - isOnline=${up.isOnline}, isActive=${isActive}, connections=${up.conns.size}, lastActivity=${new Date(up.lastActivity).toLocaleTimeString()}`);
  }
  
  console.log(`📊 Snapshot result: ${result.length} users total (${result.filter(u => u.isOnline).length} online)`);
  return result;
}

function broadcast(wss: WebSocketServer) {
  const payload = JSON.stringify({ type: "presence:update", users: snapshot() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

export function attachPresence(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: "/presence" });

  wss.on("connection", (ws: WebSocket, req: any) => {
    const cookies = parseCookie(req.headers.cookie as string | undefined);
    const token = cookies["session"];
    const decoded = token ? decodeToken(token) : null;
    if (!decoded || typeof decoded !== "object" || !(decoded as any).email) {
      ws.close(4401, "unauthorized");
      return;
    }
    const uid = (decoded as any).uid as string;
    const email = (decoded as any).email as string;
    const connId = uidConnId();

    // רשומה למשתמש לפי email (יותר יציב)
    let up = users.get(email);
    if (!up) { 
      up = { 
        uid, 
        email, 
        conns: new Map(),
        lastActivity: Date.now(),
        isOnline: true
      }; 
      users.set(email, up); 
      console.log(`🆕 New user connected: ${email} (${uid})`);
    } else {
      console.log(`🔄 Existing user reconnected: ${email} (${uid})`);
    }
    // חיבור חדש
    const connectionData = { 
      lastSeen: Date.now(), 
      lastActivity: Date.now(),
      isConnected: true 
    };
    up.conns.set(connId, connectionData);
    up.lastActivity = Date.now();
    console.log(`🔗 Connection established: ${email} -> ${connId}, total connections: ${up.conns.size}`);
    console.log(`🔗 Connection data:`, connectionData);

    // סימון לייב עבור ping/pong
    (ws as any).isAlive = true;
    ws.on("pong", () => { (ws as any).isAlive = true; });

    // hello ראשוני + ברודקאסט
    ws.send(JSON.stringify({ type: "presence:hello", you: { uid, email }, users: snapshot() }));
    broadcast(wss);

    // הודעות קליינט (heartbeat)
    ws.on("message", (raw) => {
      try {
        const m = JSON.parse(String(raw));
        if (m?.type === "heartbeat") {
          const rec = up!.conns.get(connId);
          if (rec) {
            rec.lastSeen = Date.now();
            // אם יש פעילות, עדכן את זמן הפעילות
            if (m.activity === true) {
              rec.lastActivity = Date.now();
              up!.lastActivity = Date.now();
              console.log(`🎯 Activity detected from ${email} at ${new Date(up!.lastActivity).toLocaleTimeString()}`);
            }
            up!.conns.set(connId, rec);
            console.log(`❤️ Heartbeat from ${email}: activity=${m.activity}, lastSeen=${new Date(rec.lastSeen).toLocaleTimeString()}, isConnected=${rec.isConnected}`);
          } else {
            console.log(`❌ No connection record found for ${email} -> ${connId}`);
          }
        }
      } catch (e) {
        console.log(`❌ Error parsing message from ${email}:`, e);
      }
    });

    ws.on("close", () => {
      const u = users.get(email);
      if (!u) return;
      
      // סמן את החיבור כסגור
      const conn = u.conns.get(connId);
      if (conn) {
        conn.isConnected = false;
        u.conns.set(connId, conn);
      }
      
      // אם אין חיבורים פעילים, מחק את המשתמש
      const hasActiveConnections = Array.from(u.conns.values()).some(c => c.isConnected);
      if (!hasActiveConnections) {
        users.delete(email);
      }
      
      broadcast(wss);
    });
  });

  // ping/pong + ניקוי חיבורים מתים + שידור תקופתי
  const iv = setInterval(() => {
    for (const client of wss.clients) {
      const s = client as any;
      if (!s.isAlive) { client.terminate(); continue; }
      s.isAlive = false; client.ping();
    }
    broadcast(wss);
  }, 15_000);

  wss.on("close", () => clearInterval(iv));

  return { getOnline: snapshot };
}

// אופציונלי: REST fallback
export function presenceRest(app: import("express").Express) {
  app.get("/api/presence/online", (_req, res) => res.json(snapshot()));
  
  // endpoint חדש שמחזיר את כל המשתמשים עם סטטוס נוכחות
  app.get("/api/presence/all-users", async (_req, res) => {
    try {
      // ייבוא db דינמי כדי למנוע בעיות circular import
      const db = (await import("./db.js")).default;
      
      // שליפת כל המשתמשים מהמסד נתונים
      const allUsers = db.prepare("SELECT id, email, role, status, psnUsername, secondPrizeCredit, createdAt, approvalStatus, isSuperAdmin FROM users").all() as any[];
      
      // קבלת נתוני נוכחות
      const presenceData = snapshot();
      const presenceMap = new Map(presenceData.map(p => [p.email, p]));
      
      // שילוב הנתונים עם לוגיקה חדשה שמתחשבת ב-logins
      const result = allUsers.map(user => {
        const presence = presenceMap.get(user.email);
        const now = Date.now();
        const recentLogin = recentLogins.get(user.email);
        
        // משתמש נחשב אונליין אם:
        // 1. יש לו WebSocket connection פעיל, או
        // 2. הוא התחבר לאחרונה (ב-5 דקות האחרונות)
        const hasWebSocketConnection = presence?.isOnline || false;
        const hasRecentLogin = recentLogin && (now - recentLogin) <= (5 * 60 * 1000); // 5 דקות
        
        const isOnline = hasWebSocketConnection || hasRecentLogin;
        const isActive = presence?.isActive || false;
        
        console.log(`🔍 User ${user.email}: hasWebSocket=${hasWebSocketConnection}, hasRecentLogin=${hasRecentLogin}, isOnline=${isOnline}`);
        
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          isOnline: isOnline,
          isActive: isActive,
          lastSeen: presence?.lastSeen || recentLogin || null,
          connections: presence?.connections || 0,
          psnUsername: user.psnUsername,
          secondPrizeCredit: user.secondPrizeCredit,
          createdAt: user.createdAt,
          approvalStatus: user.approvalStatus || 'approved',
          isSuperAdmin: user.isSuperAdmin === 1
        };
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error in /api/presence/all-users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}