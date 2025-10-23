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
  
  // ניקוי logins ישנים (מעל 10 דקות)
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 דקות
  for (const [userEmail, loginTime] of recentLogins.entries()) {
    if (now - loginTime > maxAge) {
      recentLogins.delete(userEmail);
    }
  }
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
  
  // הוסף משתמשים עם recent login שאין להם WebSocket connection
  for (const [email, loginTime] of recentLogins.entries()) {
    const isAlreadyInResult = result.some(r => r.email === email);
    if (!isAlreadyInResult && (now - loginTime) <= (2 * 60 * 1000)) { // 2 דקות
      console.log(`🔍 Adding recent login user: ${email} (${Math.round((now - loginTime) / 1000)}s ago)`);
      result.push({
        uid: email, // fallback למקרה שאין uid
        email: email,
        lastSeen: loginTime,
        isOnline: true,
        isActive: false,
        connections: 0
      });
    }
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
  // ✅ noServer: true = manual upgrade handling (robust behind Nginx)
  const wss = new WebSocketServer({ noServer: true });
  
  console.log("🔌 WebSocket Server initialized with noServer mode");
  console.log("📊 Waiting for WebSocket connections...");

  wss.on("connection", (ws: WebSocket, req: any) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`🔗 New WebSocket connection attempt from: ${clientIp}`);
    
    const cookies = parseCookie(req.headers.cookie as string | undefined);
    const token = cookies["session"];
    const decoded = token ? decodeToken(token) : null;
    if (!decoded || typeof decoded !== "object" || !(decoded as any).email) {
      console.log(`❌ WebSocket authentication failed from: ${clientIp}`);
      console.log(`   Reason: ${!token ? 'No session cookie' : 'Invalid token'}`);
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
    
    // ניקוי recent logins ישנים
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 דקות
    for (const [userEmail, loginTime] of recentLogins.entries()) {
      if (now - loginTime > maxAge) {
        recentLogins.delete(userEmail);
        console.log(`🧹 Cleaned old login for: ${userEmail}`);
      }
    }
    
    broadcast(wss);
  }, 15_000);

  wss.on("close", () => clearInterval(iv));

  return { getOnline: snapshot, wss };
}

// Export wss instance for broadcasting custom events (like draw events)
let wssInstance: WebSocketServer | null = null;

export function setWssInstance(wss: WebSocketServer) {
  wssInstance = wss;
}

export function broadcastEvent(type: string, data: any) {
  if (!wssInstance) {
    console.warn(`[broadcast] WSS not initialized for ${type}`);
    return;
  }
  
  const payload = JSON.stringify({ type, data });
  let sentCount = 0;
  
  for (const client of wssInstance.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sentCount++;
    }
  }
  
  console.log(`📡 Broadcasted ${type} to ${sentCount} clients`);
}

// פונקציה לקבלת נתוני נוכחות עם טיפול בשגיאות - ללא זריקת exceptions
export async function getOnlineUserIds(): Promise<string[]> {
  try {
    const presenceData = snapshot();
    const onlineUsers = presenceData.filter(p => p.isOnline);
    
    // נמיר email ל-id מהמסד נתונים
    const db = (await import("./db.js")).default;
    const userIds: string[] = [];
    
    for (const user of onlineUsers) {
      try {
        const dbUser = db.prepare("SELECT id FROM users WHERE email = ?").get(user.email) as any;
        if (dbUser) {
          userIds.push(dbUser.id);
          console.log(`🔍 Online user: ${user.email} -> ${dbUser.id}`);
        }
      } catch (dbError) {
        console.warn(`[PRESENCE] Failed to get user ID for email ${user.email}:`, dbError);
      }
    }
    
    console.log(`📊 getOnlineUserIds returning ${userIds.length} online user IDs:`, userIds);
    return userIds;
  } catch (error) {
    console.warn("[PRESENCE] Failed to get online user IDs:", error);
    return [];
  }
}

export async function getPresenceData() {
  try {
    // ייבוא db דינמי כדי למנוע בעיות circular import
    const db = (await import("./db.js")).default;
    
    // שליפת כל המשתמשים מהמסד נתונים
    let allUsers: any[] = [];
    try {
      allUsers = db.prepare("SELECT id, email, role, status, psnUsername, secondPrizeCredit, createdAt, approvalStatus, isSuperAdmin FROM users").all() as any[];
    } catch (dbError) {
      console.warn("[PRESENCE] Database query failed:", dbError instanceof Error ? dbError.message : dbError);
      return { users: [], total: 0 };
    }
    
    // קבלת נתוני נוכחות - עם fallback במקרה של כשל
    let presenceData: Array<{uid:string;email:string;lastSeen:number;isOnline:boolean;isActive:boolean;connections:number}>;
    try {
      presenceData = snapshot();
    } catch (presenceError) {
      console.warn("[PRESENCE] Snapshot unavailable:", presenceError instanceof Error ? presenceError.message : presenceError);
      presenceData = [];
    }
    const presenceMap = new Map(presenceData.map(p => [p.email, p]));
    
    // שילוב הנתונים עם לוגיקה מתוקנת
    const users = allUsers.map(user => {
      const presence = presenceMap.get(user.email);
      const now = Date.now();
      const recentLogin = recentLogins.get(user.email);
      
      // משתמש נחשב אונליין אם יש לו WebSocket connection פעיל או recent login
      const hasWebSocketConnection = presence?.isOnline || false;
      const hasRecentLogin = recentLogin && (now - recentLogin) <= (2 * 60 * 1000); // 2 דקות בלבד
      
      // משתמש אונליין אם יש לו WebSocket connection או recent login
      const isOnline = hasWebSocketConnection || hasRecentLogin;
      const isActive = presence?.isActive || false;
      
      // לוג מפורט לניפוי באגים
      if (user.email === 'yosiyoviv@gmail.com') {
        console.log(`🔍 DEBUG Yosi: hasWebSocket=${hasWebSocketConnection}, hasRecentLogin=${hasRecentLogin}, presence=${!!presence}, isOnline=${isOnline}`);
        if (presence) {
          console.log(`  WebSocket details: isOnline=${presence.isOnline}, connections=${presence.connections}, lastSeen=${new Date(presence.lastSeen).toLocaleTimeString()}`);
        }
        if (recentLogin) {
          console.log(`  Recent login: ${new Date(recentLogin).toLocaleTimeString()} (${Math.round((now - recentLogin) / 1000)}s ago)`);
        }
      }
      
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
    
    return { users, total: users.length };
  } catch (e: any) {
    console.warn("[PRESENCE] Data collection failed:", e?.message ?? e);
    return { users: [], total: 0 }; // החזר מבנה ריק במקום להפיל
  }
}

// אופציונלי: REST fallback - ללא זריקת exceptions
export function presenceRest(app: import("express").Express) {
  app.get("/api/presence/online", (_req, res) => {
    try {
      const data = snapshot();
      res.json(data);
    } catch (error) {
      console.warn("[PRESENCE] /api/presence/online failed:", error instanceof Error ? error.message : error);
      res.status(200).json([]);
    }
  });
  
  // endpoint חדש שמחזיר את כל המשתמשים עם סטטוס נוכחות
  app.get("/api/presence/all-users", async (_req, res) => {
    try {
      const data = await getPresenceData();
      res.json(data.users);
    } catch (error) {
      console.warn("[PRESENCE] /api/presence/all-users failed:", error instanceof Error ? error.message : error);
      // במקרה של כשל - החזר מערך ריק עם סטטוס 200
      res.status(200).json([]);
    }
  });
}