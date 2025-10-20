import { Router } from "express";
import db from "../db.js";
import { logger } from "../logger.js";
import argon2 from "argon2";

export const approvalRequests = Router();

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

// יצירת בקשת אישור (מנהל רגיל)
approvalRequests.post("/create", async (req, res) => {
  const { actionType, targetUserId, actionData } = req.body;
  const requesterEmail = (req as any).user?.email;
  
  if (!requesterEmail) {
    return res.status(401).json({ error: "unauthorized" });
  }
  
  // בדיקה שהמבקש הוא מנהל (אבל לא Super Admin)
  const requester = db.prepare(`SELECT id, email, role, isSuperAdmin FROM users WHERE email=?`).get(requesterEmail) as any;
  
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: "רק מנהלים יכולים ליצור בקשות אישור" });
  }
  
  if (requester.isSuperAdmin === 1) {
    return res.status(400).json({ error: "מנהל על לא צריך אישור - הפעולה תבוצע ישירות" });
  }
  
  try {
    // מניעת יצירת בקשה על מנהל על
    if (isTargetSuperAdmin(targetUserId)) {
      return res.status(403).json({ error: "לא ניתן לבצע פעולות על מנהל העל" });
    }
    
    // קבלת פרטי המשתמש המטרה
    const targetUser = db.prepare(`SELECT id, email FROM users WHERE id=?`).get(targetUserId) as any;
    
    if (!targetUser) {
      return res.status(404).json({ error: "משתמש מטרה לא נמצא" });
    }
    
    // יצירת בקשת אישור
    const { randomUUID } = await import("node:crypto");
    const requestId = randomUUID();
    
    db.prepare(`
      INSERT INTO approval_requests (id, requesterId, requesterEmail, actionType, targetUserId, targetUserEmail, actionData, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      requestId,
      requester.id,
      requester.email,
      actionType,
      targetUser.id,
      targetUser.email,
      JSON.stringify(actionData || {}),
      new Date().toISOString()
    );
    
    logger.info("approval", `New approval request created: ${actionType} for ${targetUser.email} by ${requester.email}`);
    
    res.json({ 
      ok: true, 
      message: "הבקשה נשלחה למנהל העל לאישור",
      requestId 
    });
  } catch (error) {
    logger.error("approval", "Error creating approval request", error);
    res.status(500).json({ error: "שגיאה ביצירת בקשת האישור" });
  }
});

// קבלת כל הבקשות הממתינות (מנהל על בלבד)
approvalRequests.get("/pending", (req, res) => {
  const userEmail = (req as any).user?.email;
  
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "רק מנהל על יכול לראות בקשות אישור" });
  }
  
  try {
    const requests = db.prepare(`
      SELECT * FROM approval_requests 
      WHERE status='pending' 
      ORDER BY createdAt DESC
    `).all();
    
    res.json(requests);
  } catch (error) {
    logger.error("approval", "Error fetching pending requests", error);
    res.status(500).json({ error: "שגיאה בטעינת בקשות האישור" });
  }
});

// ספירת בקשות ממתינות (מנהל על בלבד)
approvalRequests.get("/count", (req, res) => {
  const userEmail = (req as any).user?.email;
  
  if (!isSuperAdmin(userEmail)) {
    return res.json({ count: 0 });
  }
  
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM approval_requests WHERE status='pending'`).get() as any;
    res.json({ count: result.count });
  } catch (error) {
    res.json({ count: 0 });
  }
});

// אישור בקשה (מנהל על בלבד)
approvalRequests.post("/:requestId/approve", async (req, res) => {
  const { requestId } = req.params;
  const userEmail = (req as any).user?.email;
  
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "רק מנהל על יכול לאשר בקשות" });
  }
  
  try {
    // קבלת פרטי הבקשה
    const request = db.prepare(`SELECT * FROM approval_requests WHERE id=? AND status='pending'`).get(requestId) as any;
    
    if (!request) {
      return res.status(404).json({ error: "בקשה לא נמצאה או כבר טופלה" });
    }
    
    const actionData = JSON.parse(request.actionData || '{}');
    
    // ביצוע הפעולה לפי הסוג
    switch (request.actionType) {
      case 'block':
        db.prepare(`UPDATE users SET status='blocked' WHERE id=?`).run(request.targetUserId);
        break;
        
      case 'unblock':
        db.prepare(`UPDATE users SET status='active' WHERE id=?`).run(request.targetUserId);
        break;
        
      case 'reset-password':
        const hash = await argon2.hash(actionData.newPassword);
        db.prepare(`UPDATE users SET passwordHash=? WHERE id=?`).run(hash, request.targetUserId);
        break;
        
      case 'update-credit':
        db.prepare(`UPDATE users SET secondPrizeCredit=? WHERE id=?`).run(actionData.credit, request.targetUserId);
        break;
        
      case 'promote':
        db.prepare(`UPDATE users SET role='admin' WHERE id=?`).run(request.targetUserId);
        break;
        
      case 'demote':
        db.prepare(`UPDATE users SET role='player' WHERE id=?`).run(request.targetUserId);
        break;
        
      case 'delete':
        db.prepare(`DELETE FROM users WHERE id=?`).run(request.targetUserId);
        break;
        
      case 'approve-user':
        // אישור משתמש חדש - עדכון הסטטוס ל-approved
        db.prepare(`UPDATE users SET approvalStatus='approved' WHERE id=?`).run(request.targetUserId);
        break;
        
      default:
        return res.status(400).json({ error: "סוג פעולה לא ידוע" });
    }
    
    // עדכון סטטוס הבקשה
    db.prepare(`
      UPDATE approval_requests 
      SET status='approved', resolvedAt=?, resolvedBy=? 
      WHERE id=?
    `).run(new Date().toISOString(), userEmail, requestId);
    
    logger.info("approval", `Request ${requestId} approved by ${userEmail}: ${request.actionType} for ${request.targetUserEmail}`);
    
    res.json({ ok: true, message: "הבקשה אושרה והפעולה בוצעה" });
  } catch (error) {
    logger.error("approval", "Error approving request", error);
    res.status(500).json({ error: "שגיאה באישור הבקשה" });
  }
});

// דחיית בקשה (מנהל על בלבד)
approvalRequests.post("/:requestId/reject", (req, res) => {
  const { requestId } = req.params;
  const userEmail = (req as any).user?.email;
  
  if (!isSuperAdmin(userEmail)) {
    return res.status(403).json({ error: "רק מנהל על יכול לדחות בקשות" });
  }
  
  try {
    const request = db.prepare(`SELECT * FROM approval_requests WHERE id=? AND status='pending'`).get(requestId) as any;
    
    if (!request) {
      return res.status(404).json({ error: "בקשה לא נמצאה או כבר טופלה" });
    }
    
    // עדכון סטטוס הבקשה
    db.prepare(`
      UPDATE approval_requests 
      SET status='rejected', resolvedAt=?, resolvedBy=? 
      WHERE id=?
    `).run(new Date().toISOString(), userEmail, requestId);
    
    logger.info("approval", `Request ${requestId} rejected by ${userEmail}: ${request.actionType} for ${request.targetUserEmail}`);
    
    res.json({ ok: true, message: "הבקשה נדחתה" });
  } catch (error) {
    logger.error("approval", "Error rejecting request", error);
    res.status(500).json({ error: "שגיאה בדחיית הבקשה" });
  }
});

