import { Router } from "express";
import db from "../db.js";
import argon2 from "argon2";
import { logger } from "../logger.js";
import { getPresenceData } from "../presence.js";

export const admin = Router();

// Helper function to check if user is super admin
function isSuperAdmin(email: string): boolean {
  const user = db.prepare(`SELECT isSuperAdmin FROM users WHERE email=?`).get(email) as any;
  return user && user.isSuperAdmin === 1;
}

// Helper function to check if target user is super admin
function isTargetSuperAdmin(userId: string): boolean {
  const user = db.prepare(`SELECT isSuperAdmin FROM users WHERE id=?`).get(userId) as any;
  return user && user.isSuperAdmin === 1;
}

// Get all users (admin only) - now includes online status
admin.get("/users", async (req, res) => {
  console.log("🔍 API /users נקרא");
  try {
    const users = db.prepare(`SELECT id, email, role, secondPrizeCredit, createdAt, status, psnUsername, approvalStatus FROM users ORDER BY createdAt DESC`).all();
    console.log("📊 משתמשים מהמסד נתונים:", users.length, "משתמשים");
    console.log("📋 פרטי משתמשים:", users);
    
    // הוסף נתוני נוכחות
    let usersWithPresence = users;
    try {
      const { getPresenceData } = await import("../presence.js");
      const presenceData = await getPresenceData();
      const presenceMap = new Map(presenceData.users.map((u: any) => [u.email, u]));
      
      usersWithPresence = users.map((user: any) => ({
        ...user,
        isOnline: presenceMap.get(user.email)?.isOnline || false,
        isActive: presenceMap.get(user.email)?.isActive || false,
        lastSeen: presenceMap.get(user.email)?.lastSeen || null,
        connections: presenceMap.get(user.email)?.connections || 0
      }));
      
      console.log("📡 נוספו נתוני נוכחות למשתמשים");
    } catch (presenceError) {
      console.warn("⚠️ לא ניתן לטעון נתוני נוכחות:", presenceError);
      // המשך עם הנתונים הרגילים
    }
    
    // מניעת cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(usersWithPresence);
  } catch (error) {
    console.error("❌ שגיאה בטעינת משתמשים:", error);
    res.status(500).json({ error: "שגיאה בטעינת משתמשים" });
  }
});

// Get users with online status (admin only)
admin.get("/users/online-status", async (req, res) => {
  try {
    // Get all users
    const allUsers = db.prepare(`SELECT id, email, role, secondPrizeCredit, createdAt, status, psnUsername FROM users ORDER BY createdAt DESC`).all() as any[];
    
    // Get online users from presence
    let onlineUsers: any[] = [];
    try {
      const presence = await import("../presence.js");
      const onlineUserIds = await presence.getOnlineUserIds();
      onlineUsers = allUsers.filter((user: any) => onlineUserIds.includes(user.id));
    } catch (error) {
      console.warn("⚠️ לא ניתן לקבל מידע על משתמשים מחוברים:", error);
    }
    
    // Add isOnline property to all users
    const usersWithStatus = allUsers.map((user: any) => ({
      ...user,
      isOnline: onlineUsers.some((online: any) => online.id === user.id)
    }));
    
    res.json({
      allUsers: usersWithStatus,
      onlineUsers: onlineUsers.map(user => user.id), // מחזיר רק את ה-ID-ים
      total: allUsers.length,
      online: onlineUsers.length
    });
  } catch (error) {
    console.error("❌ שגיאה בטעינת משתמשים עם סטטוס:", error);
    res.status(500).json({ error: "שגיאה בטעינת משתמשים" });
  }
});

// Get online users (admin only) - תמיד מחזיר תשובה תקינה
admin.get("/online-users", async (req, res) => {
  // יצירת timeout promise (800ms - timeout רך)
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("presence_timeout")), 800)
  );

  try {
    // ריצת getPresenceData עם timeout של 800ms
    const data = await Promise.race([getPresenceData(), timeout]);
    
    // יצירת רשימת משתמשים מחוברים
    const onlineUsers = data.users.filter((user: any) => user.isOnline);
    const onlineUserIds = onlineUsers.map((user: any) => user.id);
    
    logger.info("admin", `Found ${onlineUserIds.length} users online`);
    
    // החזרת תשובה תמיד 200 OK
    res.json({ 
      onlineUsers: onlineUserIds,
      allUsers: data.users,
      total: data.total,
      debug: {
        totalUsers: data.users.length,
        onlineUsers: onlineUserIds.length
      }
    });
  } catch (e: any) {
    // טיפול בשגיאות - תמיד מחזיר 200 OK עם מבנה ריק
    console.warn("[ADMIN] Failed to get online users:", e?.message ?? e);
    res.status(200).json({ 
      onlineUsers: [], 
      allUsers: [], 
      total: 0,
      debug: {
        totalUsers: 0,
        onlineUsers: 0
      }
    });
  }
});

// Block user
admin.post("/users/:userId/block", (req, res) => {
  const { userId } = req.params;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  // בדיקה שלא חוסמים מנהל
  const user = db.prepare(`SELECT role FROM users WHERE id=?`).get(userId) as any;
  if (user?.role === "admin") {
    return res.status(400).json({ error: "לא ניתן לחסום מנהל" });
  }
  
  db.prepare(`UPDATE users SET status='blocked' WHERE id=?`).run(userId);
  res.json({ ok: true });
});

// Unblock user
admin.post("/users/:userId/unblock", (req, res) => {
  const { userId } = req.params;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  db.prepare(`UPDATE users SET status='active' WHERE id=?`).run(userId);
  res.json({ ok: true });
});

// Update user credit (super admin only)
admin.post("/users/:userId/credit", (req, res) => {
  const { userId } = req.params;
  const { credit } = req.body;
  const userEmail = (req as any).user?.email;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  if (typeof credit !== "number" || credit < 0) {
    return res.status(400).json({ error: "סכום זיכוי לא תקין" });
  }
  
  db.prepare(`UPDATE users SET secondPrizeCredit=? WHERE id=?`).run(credit, userId);
  res.json({ ok: true });
});

// Reset user password (super admin only)
admin.post("/users/:userId/reset-password", async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const userEmail = (req as any).user?.email;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" });
  }
  
  try {
    const hash = await argon2.hash(newPassword);
    db.prepare(`UPDATE users SET passwordHash=? WHERE id=?`).run(hash, userId);
    
    logger.info("admin", `Password reset for user ${userId}`);
    
    res.json({ ok: true, message: "הסיסמה שונתה בהצלחה" });
  } catch (error) {
    logger.error("admin", "Error resetting password", error);
    res.status(500).json({ error: "שגיאה בשינוי הסיסמה" });
  }
});

// Promote user to admin (super admin only)
admin.post("/users/:userId/promote", (req, res) => {
  const { userId } = req.params;
  const userEmail = (req as any).user?.email;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  db.prepare(`UPDATE users SET role='admin' WHERE id=?`).run(userId);
  logger.info("admin", `User ${userId} promoted to admin by ${userEmail}`);
  
  res.json({ ok: true, message: "המשתמש הועלה לדרגת מנהל" });
});

// Demote admin to player (super admin only)
admin.post("/users/:userId/demote", (req, res) => {
  const { userId } = req.params;
  const userEmail = (req as any).user?.email;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
  }
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  db.prepare(`UPDATE users SET role='player' WHERE id=?`).run(userId);
  logger.info("admin", `User ${userId} demoted to player by ${userEmail}`);
  
  res.json({ ok: true, message: "המשתמש הורד לדרגת שחקן" });
});

// Delete user (super admin only) - כולל מנהלים
admin.delete("/users/:userId", (req, res) => {
  const { userId } = req.params;
  const userEmail = (req as any).user?.email;
  
  // מניעת פעולה על מנהל על
  if (isTargetSuperAdmin(userId)) {
    return res.status(403).json({ error: "לא ניתן למחוק את מנהל העל" });
  }
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  try {
    // בדיקה אם המשתמש קיים
    const user = db.prepare(`SELECT id, email, role FROM users WHERE id=?`).get(userId) as any;
    
    if (!user) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }
    
    // מחיקת המשתמש (כולל מנהלים)
    db.prepare(`DELETE FROM users WHERE id=?`).run(userId);
    
    logger.info("admin", `User deleted: ${user.email} (Role: ${user.role}, ID: ${userId}) by ${userEmail}`);
    
    res.json({ ok: true, message: "המשתמש נמחק בהצלחה" });
  } catch (error) {
    logger.error("admin", "Error deleting user", error);
    res.status(500).json({ error: "שגיאה במחיקת המשתמש" });
  }
});

// Add new admin by email (super admin only)
admin.post("/users/add-admin", async (req, res) => {
  const { email, password } = req.body;
  const userEmail = (req as any).user?.email;
  
  // בדיקת הרשאת Super Admin
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "פעולה זו דורשת הרשאת מנהל על" });
  }
  
  try {
    // בדיקת קלט
    if (!email || !password) {
      return res.status(400).json({ error: "חסר אימייל או סיסמה" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" });
    }
    
    // בדיקה אם המשתמש כבר קיים
    const existing = db.prepare(`SELECT id FROM users WHERE email=?`).get(email);
    if (existing) {
      return res.status(400).json({ error: "משתמש עם אימייל זה כבר קיים" });
    }
    
    // יצירת משתמש מנהל חדש
    const argon2 = (await import("argon2")).default;
    const hash = await argon2.hash(password);
    const { randomUUID } = await import("node:crypto");
    const id = randomUUID();
    
    db.prepare(`
      INSERT INTO users (id, email, passwordHash, role, createdAt, approvalStatus, isSuperAdmin) 
      VALUES (?, ?, ?, 'admin', ?, 'approved', 0)
    `).run(id, email, hash, new Date().toISOString());
    
    logger.info("admin", `New admin created: ${email} by ${userEmail}`);
    
    res.json({ ok: true, message: "מנהל חדש נוצר בהצלחה" });
  } catch (error) {
    logger.error("admin", "Error creating admin", error);
    res.status(500).json({ error: "שגיאה ביצירת המנהל" });
  }
});

// Get tournament registration status (admin only)
admin.get("/tournament-registrations", async (req, res) => {
  try {
    // מצא טורניר פעיל או ברירת מחדל
    let tournament = db.prepare(`
      SELECT * FROM tournaments 
      WHERE registrationStatus = 'collecting' 
      ORDER BY createdAt DESC 
      LIMIT 1
    `).get() as any;

    if (!tournament) {
      // אם אין טורניר פעיל, נחפש את טורניר ברירת המחדל
      tournament = db.prepare(`
        SELECT * FROM tournaments 
        WHERE id = 'default-tournament'
        ORDER BY createdAt DESC 
        LIMIT 1
      `).get() as any;
    }

    if (!tournament) {
      // אם עדיין לא נמצא, מצא את הטורניר האחרון
      tournament = db.prepare(`
        SELECT * FROM tournaments 
        ORDER BY createdAt DESC 
        LIMIT 1
      `).get() as any;
    }

    if (!tournament) {
      return res.json({
        ok: true,
        tournament: null,
        registrations: [],
        totalRegistrations: 0,
        message: "אין טורניר פעיל"
      });
    }

    // קבל את כל הרישומים לטורניר
    const registrations = db.prepare(`
      SELECT tr.*, u.email, u.psnUsername, u.role, u.createdAt as userCreatedAt
      FROM tournament_registrations tr
      JOIN users u ON u.id = tr.userId
      WHERE tr.tournamentId = ? AND tr.state = 'registered'
      ORDER BY tr.createdAt DESC
    `).all(tournament.id);

    res.json({
      ok: true,
      tournament: {
        id: tournament.id,
        title: tournament.title,
        registrationStatus: tournament.registrationStatus,
        registrationCapacity: tournament.registrationCapacity,
        registrationMinPlayers: tournament.registrationMinPlayers
      },
      registrations: registrations,
      totalRegistrations: registrations.length
    });
  } catch (error) {
    console.error("❌ שגיאה בטעינת רישומים לטורניר:", error);
    res.status(500).json({ error: "שגיאה בטעינת רישומים לטורניר" });
  }
});