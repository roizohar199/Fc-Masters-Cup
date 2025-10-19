import { Router } from "express";
import db from "../db.js";
import { sendUserApprovedEmail } from "../email.js";
import { logger } from "../logger.js";
import { requireAuth } from "../auth.js";

export const adminUsers = Router();

// אישור משתמש (מהמייל או מהפאנל)
adminUsers.get("/approve-user", async (req, res) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שגיאה - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #dc3545; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ שגיאה</h1>
          <p>קישור לא תקין. אנא נסה שוב או צור קשר עם התמיכה.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  try {
    const user = db.prepare(`SELECT id, email, approvalStatus FROM users WHERE approvalToken=?`).get(token) as any;
    
    if (!user) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>משתמש לא נמצא - FC Masters Cup</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            h1 { color: #dc3545; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ משתמש לא נמצא</h1>
            <p>המשתמש לא נמצא במערכת. ייתכן שהקישור פג תוקף או שהמשתמש כבר אושר/נדחה.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    if (user.approvalStatus === 'approved') {
      return res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>כבר אושר - FC Masters Cup</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            h1 { color: #28a745; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ המשתמש כבר אושר</h1>
            <p>המשתמש <strong>${user.email}</strong> כבר אושר בעבר.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // אישור המשתמש
    db.prepare(`UPDATE users SET approvalStatus='approved' WHERE id=?`).run(user.id);
    
    // שליחת מייל למשתמש שהוא אושר
    await sendUserApprovedEmail(user.email);
    
    logger.info("admin", `User approved: ${user.email}`);
    
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>המשתמש אושר - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #28a745; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
          .email { background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ המשתמש אושר בהצלחה!</h1>
          <p>המשתמש הבא אושר ויכול כעת להתחבר לאתר:</p>
          <div class="email">${user.email}</div>
          <p>המשתמש קיבל מייל אישור והוא יכול כעת להתחבר לאתר.</p>
          <a href="${process.env.SITE_URL || 'http://localhost:5173'}/admin">חזרה לפאנל הניהול</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("admin", "Failed to approve user", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שגיאה - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #dc3545; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ שגיאה</h1>
          <p>אירעה שגיאה באישור המשתמש. אנא נסה שוב מאוחר יותר.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// דחיית משתמש (מהמייל או מהפאנל)
adminUsers.get("/reject-user", async (req, res) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שגיאה - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #dc3545; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ שגיאה</h1>
          <p>קישור לא תקין. אנא נסה שוב או צור קשר עם התמיכה.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  try {
    const user = db.prepare(`SELECT id, email, approvalStatus FROM users WHERE approvalToken=?`).get(token) as any;
    
    if (!user) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>משתמש לא נמצא - FC Masters Cup</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            h1 { color: #dc3545; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ משתמש לא נמצא</h1>
            <p>המשתמש לא נמצא במערכת. ייתכן שהקישור פג תוקף או שהמשתמש כבר אושר/נדחה.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // דחיית המשתמש
    db.prepare(`UPDATE users SET approvalStatus='rejected' WHERE id=?`).run(user.id);
    
    logger.info("admin", `User rejected: ${user.email}`);
    
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>המשתמש נדחה - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #dc3545; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
          .email { background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ המשתמש נדחה</h1>
          <p>המשתמש הבא נדחה ולא יוכל להתחבר לאתר:</p>
          <div class="email">${user.email}</div>
          <a href="${process.env.SITE_URL || 'http://localhost:5173'}/admin">חזרה לפאנל הניהול</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("admin", "Failed to reject user", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שגיאה - FC Masters Cup</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          h1 { color: #dc3545; }
          p { color: #666; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ שגיאה</h1>
          <p>אירעה שגיאה בדחיית המשתמש. אנא נסה שוב מאוחר יותר.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// API לאישור משתמש מהפאנל (דורש הרשאת מנהל)
adminUsers.post("/approve-user-api", async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "חסר userId" });
  }
  
  try {
    const user = db.prepare(`SELECT id, email, approvalStatus FROM users WHERE id=?`).get(userId) as any;
    
    if (!user) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }
    
    if (user.approvalStatus === 'approved') {
      return res.json({ success: true, message: "המשתמש כבר אושר" });
    }
    
    // אישור המשתמש
    db.prepare(`UPDATE users SET approvalStatus='approved' WHERE id=?`).run(user.id);
    
    // שליחת מייל למשתמש שהוא אושר
    await sendUserApprovedEmail(user.email);
    
    logger.info("admin", `User approved via API: ${user.email}`);
    
    res.json({ success: true, message: "המשתמש אושר בהצלחה!" });
  } catch (error) {
    logger.error("admin", "Failed to approve user via API", error);
    res.status(500).json({ error: "שגיאה באישור המשתמש" });
  }
});

// API לדחיית משתמש מהפאנל (דורש הרשאת מנהל)
adminUsers.post("/reject-user-api", async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "חסר userId" });
  }
  
  try {
    const user = db.prepare(`SELECT id, email, approvalStatus FROM users WHERE id=?`).get(userId) as any;
    
    if (!user) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }
    
    // דחיית המשתמש
    db.prepare(`UPDATE users SET approvalStatus='rejected' WHERE id=?`).run(user.id);
    
    logger.info("admin", `User rejected via API: ${user.email}`);
    
    res.json({ success: true, message: "המשתמש נדחה" });
  } catch (error) {
    logger.error("admin", "Failed to reject user via API", error);
    res.status(500).json({ error: "שגיאה בדחיית המשתמש" });
  }
});

