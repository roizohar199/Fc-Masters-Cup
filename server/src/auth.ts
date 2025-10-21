import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import db from "./db.js";
import { randomUUID } from "node:crypto";
import { randomBytes } from "node:crypto";
import { logger } from "./logger.js";

const COOKIE_NAME = "session";

// JWT_SECRET getter - check on first access after env is loaded
function getJwtSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    logger.error("auth", "JWT_SECRET must be set in environment variables!");
    throw new Error("❌ CRITICAL: JWT_SECRET environment variable is required for security!");
  }
  return JWT_SECRET;
}

export async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const pwd = process.env.ADMIN_PASSWORD;
  
  if (!email || !pwd) { 
    logger.warn("auth", "ADMIN_EMAIL/ADMIN_PASSWORD not set; admin seeding skipped");
    return; 
  }

  logger.info("auth", `Checking admin user: ${email}`);
  
  try {
    const row = db.prepare(`SELECT id, email, role FROM users WHERE email=?`).get(email) as any;
    const hash = await argon2.hash(pwd);
    
    if (row) {
      // משתמש קיים - עדכן את הסיסמה ותפקיד
      logger.info("auth", `Updating existing admin user: ${email}`);
      db.prepare(`UPDATE users SET passwordHash=?, role=?, status='active' WHERE email=?`).run(
        hash,
        'admin',
        email
      );
      logger.success("auth", `Admin user updated successfully: ${email}`);
    } else {
      // משתמש חדש - צור אותו
      logger.info("auth", `Creating new admin user: ${email}`);
      db.prepare(`INSERT INTO users (id,email,passwordHash,role,createdAt) VALUES (?,?,?,?,?)`).run(
        randomUUID(), 
        email, 
        hash,
        'admin',
        new Date().toISOString()
      );
      logger.success("auth", `Admin user created successfully: ${email}`);
    }
  } catch (error) {
    logger.error("auth", "Failed to seed admin user", error);
    throw error;
  }
}

export function withCookies() { 
  return cookieParser(); 
}

export async function verifyPassword(password: string, hash: string) {
  try { 
    return await argon2.verify(hash, password); 
  } catch { 
    return false; 
  }
}

export function signToken(payload: object, expSeconds = 60*60*24*7) { // 7 days
  // הוסף timestamp ליצירת הטוקן
  const payloadWithTimestamp = {
    ...payload,
    iat: Math.floor(Date.now() / 1000) // issued at time
  };
  return jwt.sign(payloadWithTimestamp, getJwtSecret(), { expiresIn: expSeconds });
}

export function decodeToken(token: string) {
  try { 
    return jwt.verify(token, getJwtSecret()) as any; 
  } catch { 
    return null; 
  }
}

/**
 * בודק אם הטוקן תקף לאחר שינוי סיסמה
 * מחזיר true אם הטוקן עדיין תקף, false אם בוטל
 */
export function isTokenValidAfterPasswordChange(decoded: any): boolean {
  if (!decoded || !decoded.email) return false;
  
  try {
    const user = db.prepare(`SELECT passwordChangedAt FROM users WHERE email=?`).get(decoded.email) as any;
    
    if (!user) return false;
    
    // אם אין תאריך שינוי סיסמה, הטוקן תקף
    if (!user.passwordChangedAt) return true;
    
    // אם הטוקן נוצר לפני שינוי הסיסמה, הוא לא תקף
    const passwordChangedTimestamp = new Date(user.passwordChangedAt).getTime() / 1000;
    const tokenIssuedAt = decoded.iat || 0;
    
    return tokenIssuedAt >= passwordChangedTimestamp;
  } catch (error) {
    logger.error("auth", "Error checking token validity after password change", error);
    return false;
  }
}

export function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax", // lax עובד טוב יותר הן בפיתוח והן בפרודקשן
    secure: isProd, // set true only behind HTTPS in production
    maxAge: 1000*60*60*24*7 // 7 days
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || (req.headers.authorization?.replace(/^Bearer\s+/i, ""));
  if (!token) return res.status(401).json({ error: "unauthorized" });
  const decoded = decodeToken(token);
  if (!decoded) return res.status(401).json({ error: "invalid token" });
  
  // בדוק אם הטוקן בוטל בגלל שינוי סיסמה
  if (!isTokenValidAfterPasswordChange(decoded)) {
    return res.status(401).json({ 
      error: "הסיסמה שלך שונתה. אנא התחבר מחדש.",
      passwordChanged: true 
    });
  }
  
  // שליפת פרטי המשתמש מהדאטאבייס כדי לקבל את ה-role וה-הרשאות
  const user = db.prepare(`SELECT id, email, role, isSuperAdmin FROM users WHERE email=?`).get(decoded.email) as any;
  if (!user) return res.status(401).json({ error: "user not found" });
  
  // הוספת מידע הרשאות ל-req.user
  (req as any).user = {
    ...decoded,
    id: user.id,
    role: user.role,
    is_admin: user.role === 'admin',
    is_manager: user.role === 'admin',
    isSuperAdmin: user.isSuperAdmin === 1
  };
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || (req.headers.authorization?.replace(/^Bearer\s+/i, ""));
  if (!token) return res.status(401).json({ error: "unauthorized" });
  const decoded = decodeToken(token);
  if (!decoded) return res.status(401).json({ error: "invalid token" });
  
  // בדיקה אם המשתמש הוא Super Admin
  const user = db.prepare(`SELECT isSuperAdmin FROM users WHERE email=?`).get(decoded.email) as any;
  if (!user || user.isSuperAdmin !== 1) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  (req as any).user = decoded;
  next();
}

export async function authenticate(email: string, password: string) {
  const row = db.prepare(`SELECT id,email,passwordHash,role,secondPrizeCredit,status,psnUsername,isSuperAdmin FROM users WHERE email=?`).get(email) as any;
  if (!row) return null;
  
  // בדיקה אם המשתמש חסום
  if (row.status === "blocked") return null;
  
  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) return null;
  return { 
    uid: row.id, 
    email: row.email, 
    role: row.role, 
    secondPrizeCredit: row.secondPrizeCredit, 
    psnUsername: row.psnUsername,
    isSuperAdmin: row.isSuperAdmin === 1
  };
}

export async function registerUser(email: string, password: string, psnUsername?: string) {
  const existing = db.prepare(`SELECT id FROM users WHERE email=?`).get(email);
  if (existing) return null; // email already exists
  const hash = await argon2.hash(password);
  const id = randomUUID();
  const approvalToken = randomUUID(); // טוקן ייחודי לאישור המשתמש
  const createdAt = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, createdAt, psnUsername, approvalStatus, approvalToken) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, email, hash, 'player', createdAt, psnUsername || null, 'pending', approvalToken
  );
  
  return { 
    uid: id, 
    email, 
    role: 'player', 
    secondPrizeCredit: 0, 
    psnUsername,
    createdAt,
    approvalToken,
    approvalStatus: 'pending'
  };
}

export function createPasswordResetToken(email: string) {
  const user = db.prepare(`SELECT id FROM users WHERE email=?`).get(email) as any;
  if (!user) return null;
  
  // מחיקת טוקנים קיימים למשתמש זה
  db.prepare(`DELETE FROM password_resets WHERE email=?`).run(email);
  
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30*60*1000).toISOString(); // 30 דקות
  const id = randomUUID();
  
  db.prepare(`INSERT INTO password_resets (id,email,token,expiresAt,createdAt) VALUES (?,?,?,?,?)`).run(
    id, email, token, expiresAt, new Date().toISOString()
  );
  
  return token;
}

export async function resetPassword(token: string, newPassword: string, email?: string) {
  const reset = db.prepare(`SELECT email,expiresAt FROM password_resets WHERE token=?`).get(token) as any;
  if (!reset) return false;
  
  // אם סופק email, בדוק שהוא תואם לטוקן
  if (email && reset.email !== email) {
    logger.warn("auth", `Password reset token mismatch: token for ${reset.email}, but email provided: ${email}`);
    return false;
  }
  
  if (new Date(reset.expiresAt) < new Date()) {
    db.prepare(`DELETE FROM password_resets WHERE token=?`).run(token);
    return false; // token expired
  }
  
  const hash = await argon2.hash(newPassword);
  
  // עדכון הסיסמה עם timestamp של שינוי
  const now = new Date().toISOString();
  db.prepare(`UPDATE users SET passwordHash=?, passwordChangedAt=? WHERE email=?`).run(hash, now, reset.email);
  
  // מחיקת הטוקן לאחר שימוש
  db.prepare(`DELETE FROM password_resets WHERE token=?`).run(token);
  
  // מחיקת כל הטוקנים הפעילים של המשתמש (session invalidation)
  db.prepare(`DELETE FROM password_resets WHERE email=?`).run(reset.email);
  
  return true;
}

