import { Router } from "express";
import db from "../db.js";
import argon2 from "argon2";
import { logger } from "../logger.js";

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

// Get all users (admin only)
admin.get("/users", (req, res) => {
  const users = db.prepare(`SELECT id, email, role, secondPrizeCredit, createdAt, status, psnUsername FROM users ORDER BY createdAt DESC`).all();
  
  // מניעת cache
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.json(users);
});

// Get online users (admin only)
admin.get("/online-users", async (req, res) => {
  try {
    // קבלת נתוני נוכחות ממערכת ה-presence
    const presenceResponse = await fetch(`http://localhost:${process.env.PORT || 8787}/api/presence/all-users`);
    if (!presenceResponse.ok) {
      throw new Error("Failed to get presence data");
    }
    
    const allUsersWithPresence = await presenceResponse.json();
    
    // יצירת רשימת משתמשים מחוברים
    const onlineUsers = allUsersWithPresence.filter((user: any) => user.isOnline);
    const onlineUserIds = onlineUsers.map((user: any) => user.id);
    
    logger.info("admin", `Found ${onlineUserIds.length} users online:`, {
      users: onlineUsers.map((u: any) => ({ id: u.id, email: u.email, isOnline: u.isOnline, isActive: u.isActive }))
    });
    
    res.json({ 
      onlineUsers: onlineUserIds,
      allUsers: allUsersWithPresence, // נשלח את כל המשתמשים עם נתוני נוכחות
      debug: {
        totalUsers: allUsersWithPresence.length,
        onlineUsers: onlineUserIds.length,
        userDetails: onlineUsers.map((u: any) => ({ id: u.id, email: u.email }))
      }
    });
  } catch (error) {
    logger.error("admin", "Failed to get online users", error);
    res.json({ onlineUsers: [] });
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