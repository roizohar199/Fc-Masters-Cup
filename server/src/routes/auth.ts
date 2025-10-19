import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { authenticate, registerUser, createPasswordResetToken, resetPassword, setSessionCookie, clearSessionCookie, signToken, decodeToken } from "../auth.js";
import { RegisterDTO, ForgotPasswordDTO, ResetPasswordDTO } from "../models.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "../email.js";
import db from "../db.js";

export const auth = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting disabled - no limits
const limiter = (req: any, res: any, next: any) => next();
const emailLimiter = (req: any, res: any, next: any) => next();

auth.post("/login", limiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "missing email/password" });

    const user = await authenticate(email, password);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    // בדיקת סטטוס אישור המשתמש
    const { default: db } = await import("../db.js");
    const userRecord = db.prepare(`SELECT approvalStatus FROM users WHERE email=?`).get(email) as any;
    
    if (userRecord && userRecord.approvalStatus === 'pending') {
      return res.status(403).json({ 
        error: "החשבון שלך ממתין לאישור המנהל. תקבל מייל ברגע שהחשבון יאושר.",
        pendingApproval: true
      });
    }
    
    if (userRecord && userRecord.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        error: "החשבון שלך נדחה על ידי המנהל. לפרטים נוספים, צור קשר עם המנהל.",
        rejected: true
      });
    }

    const token = signToken({ uid: user.uid, email: user.email, role: user.role });
    setSessionCookie(res, token);

    // עדכון זמן login במערכת הנוכחות – לא להכשיל התחברות במקרה של כשל
    try {
      const { updateUserLogin } = await import("../presence.js");
      updateUserLogin(email);
    } catch (e) {
      // נרשום אזהרה בלבד כדי לא לשבור את ההתחברות
      const { logger } = await import("../logger.js");
      logger?.warn?.("auth", "presence update failed on login", e as any);
    }

    res.json({ ok: true, email: user.email, role: user.role, secondPrizeCredit: user.secondPrizeCredit });
  } catch (error) {
    const { logger } = await import("../logger.js");
    logger.error("auth", "Login failed with unexpected error", error);
    res.status(500).json({ error: "internal server error" });
  }
});

auth.post("/logout", (req, res) => { 
  clearSessionCookie(res); 
  res.json({ ok: true }); 
});

// רענון role מהדאטאבייס (למקרה של שינוי role)
auth.post("/refresh-role", (req, res) => {
  const token = (req.cookies && (req.cookies as any)["session"]) || (req.headers.authorization?.replace(/^Bearer\s+/i, ""));
  if (!token) return res.status(401).json({ error: "לא מחובר" });
  
  const decoded = decodeToken(token);
  if (!decoded) return res.status(401).json({ error: "טוקן לא תקף" });
  
  // שליפת נתוני משתמש מעודכנים מ-DB
  const user = db.prepare(`SELECT role, secondPrizeCredit, status, psnUsername FROM users WHERE email=?`).get(decoded.email) as any;
  
  if (!user) return res.status(404).json({ error: "משתמש לא נמצא" });
  
  // אם המשתמש חסום
  if (user.status === "blocked") return res.status(403).json({ error: "המשתמש חסום" });
  
  // יצירת token חדש עם ה-role המעודכן
  const newToken = signToken({ uid: decoded.uid, email: decoded.email, role: user.role });
  setSessionCookie(res, newToken);
  
  res.json({ ok: true, email: decoded.email, role: user.role, secondPrizeCredit: user.secondPrizeCredit, psnUsername: user.psnUsername });
});

auth.get("/me", (req, res) => {
  const token = (req.cookies && (req.cookies as any)["session"]) || (req.headers.authorization?.replace(/^Bearer\s+/i, ""));
  if (!token) return res.json({ ok: false });
  const decoded = decodeToken(token);
  if (!decoded) return res.json({ ok: false });
  
  // שליפת נתוני משתמש מעודכנים מ-DB
  const user = db.prepare(`SELECT role, secondPrizeCredit, status, psnUsername, isSuperAdmin FROM users WHERE email=?`).get(decoded.email) as any;
  
  if (!user) return res.json({ ok: false });
  
  // אם המשתמש חסום, מחזירים שגיאה
  if (user.status === "blocked") return res.status(403).json({ error: "המשתמש חסום" });
  
  res.json({ 
    ok: true, 
    email: decoded.email, 
    role: user.role, 
    secondPrizeCredit: user.secondPrizeCredit, 
    psnUsername: user.psnUsername,
    isSuperAdmin: user.isSuperAdmin === 1
  });
});

auth.post("/register", limiter, async (req, res) => {
  console.log('Got hereeee123456');
  const parsed = RegisterDTO.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "נתונים לא תקינים" });
  
  const { email, password, psnUsername } = parsed.data;
  const user = await registerUser(email, password, psnUsername);
  
  if (!user) return res.status(400).json({ error: "כתובת האימייל כבר קיימת במערכת" });
  
  // שליחת מייל למשתמש שההרשמה ממתינה לאישור
  const { sendPendingApprovalEmail, sendAdminApprovalRequest } = await import("../email.js");
  await sendPendingApprovalEmail(email);
  
  // שליחת מייל למנהל עם קישור לאישור המשתמש
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendAdminApprovalRequest(adminEmail, { 
      email: user.email, 
      psnUsername: user.psnUsername, 
      createdAt: user.createdAt,
      approvalToken: user.approvalToken
    });
  }
  
  // לא מחזירים טוקן התחברות - המשתמש צריך לחכות לאישור
  res.json({ 
    ok: true, 
    message: "ההרשמה התקבלה בהצלחה! תקבל מייל ברגע שהמנהל יאשר את חשבונך.",
    pendingApproval: true
  });
});

auth.post("/forgot-password", emailLimiter, async (req, res) => {
  const { logger } = await import("../logger.js");
  
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 FORGOT PASSWORD REQUEST START");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📥 Request Body:", JSON.stringify(req.body, null, 2));
    console.log("🌐 IP Address:", req.ip);
    console.log("🕒 Timestamp:", new Date().toISOString());
    
    const parsed = ForgotPasswordDTO.safeParse(req.body);
    if (!parsed.success) {
      console.log("❌ Validation FAILED:", parsed.error);
      logger.error("auth", "Forgot password validation failed", parsed.error);
      return res.status(400).json({ error: "נתונים לא תקינים" });
    }
    
    const { email } = parsed.data;
    console.log("✅ Validation OK - Email:", email);
    
    // בדיקה אם המשתמש קיים במערכת
    console.log("🔍 Checking user in database...");
    const user = db.prepare(`SELECT email, status FROM users WHERE email=?`).get(email) as any;
    
    if (!user) {
      console.log("⚠️ User NOT FOUND in database");
      logger.warn("auth", `Password reset requested for non-existent email: ${email}`);
    } else {
      console.log("👤 User FOUND - Status:", user.status);
    }
    
    // תמיד מחזירים הצלחה כדי לא לחשוף אם המייל קיים או לא
    if (user && user.status === 'active') {
      console.log("🎫 Creating password reset token...");
      const token = createPasswordResetToken(email);
      
      if (token) {
        console.log("✅ Token created successfully:", token.substring(0, 20) + "...");
        console.log("📧 Sending password reset email...");
        
        try {
          await sendPasswordResetEmail(email, token);
          console.log("✅ Email sent successfully!");
          logger.info("auth", `Password reset email sent to: ${email} from IP: ${req.ip}`);
        } catch (emailError) {
          console.log("❌ Email sending FAILED:", emailError);
          logger.error("auth", `Failed to send password reset email to ${email}`, emailError);
        }
      } else {
        console.log("❌ Token creation FAILED");
        logger.error("auth", `Failed to create reset token for: ${email}`);
      }
    } else if (user && user.status !== 'active') {
      console.log("⚠️ User exists but status is:", user.status);
      logger.warn("auth", `Password reset requested for inactive user: ${email} (status: ${user.status})`);
    }
    
    console.log("📤 Sending success response to client");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 FORGOT PASSWORD REQUEST END");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    res.json({ ok: true, message: "אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה" });
  } catch (error) {
    console.log("💥 CRITICAL ERROR:", error);
    logger.error("auth", "Forgot password failed with exception", error);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    res.status(500).json({ error: "שגיאה פנימית בשרת" });
  }
});

auth.post("/reset-password", emailLimiter, async (req, res) => {
  try {
    const parsed = ResetPasswordDTO.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "נתונים לא תקינים" });
    
    const { token, newPassword, email } = parsed.data;
    
    // בדיקת חוזק הסיסמה
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" });
    }
    
    const success = await resetPassword(token, newPassword, email);
    
    if (!success) return res.status(400).json({ error: "הטוקן לא תקף או שפג תוקפו" });
    
    // שליחת מייל אישור איפוס סיסמה
    if (email) {
      await sendPasswordResetSuccessEmail(email);
    }
    
    // לוג לניטור
    const { logger } = await import("../logger.js");
    logger.info("auth", `Password reset completed for: ${email} from IP: ${req.ip}`);
    
    res.json({ ok: true, message: "הסיסמה אופסה בהצלחה" });
  } catch (error) {
    const { logger } = await import("../logger.js");
    logger.error("auth", "Reset password failed", error);
    res.status(500).json({ error: "שגיאה פנימית בשרת" });
  }
});

// Change password (requires authentication)
auth.post("/change-password", limiter, async (req, res) => {
  const token = (req.cookies && (req.cookies as any)["session"]) || (req.headers.authorization?.replace(/^Bearer\s+/i, ""));
  if (!token) return res.status(401).json({ error: "לא מחובר" });
  
  const decoded = decodeToken(token);
  if (!decoded) return res.status(401).json({ error: "טוקן לא תקף" });
  
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "חסרים פרטים" });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "הסיסמה חדשה חייבת להכיל לפחות 6 תווים" });
  }
  
  // בדיקת הסיסמה הנוכחית
  const user = await authenticate(decoded.email, currentPassword);
  if (!user) {
    return res.status(401).json({ error: "הסיסמה הנוכחית שגויה" });
  }
  
  // עדכון לסיסמה חדשה
  const { default: argon2 } = await import("argon2");
  const hash = await argon2.hash(newPassword);
  db.prepare(`UPDATE users SET passwordHash=? WHERE email=?`).run(hash, decoded.email);
  
  res.json({ ok: true, message: "הסיסמה שונתה בהצלחה" });
});

// Google OAuth routes
auth.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"],
  session: false 
}));

auth.get("/google/callback", 
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        console.error("Google OAuth: No user in request");
        return res.redirect("/login?error=auth_failed");
      }
      
      console.log("Google OAuth: User authenticated:", user.email);
      
      // בדוק אם המשתמש מאושר
      const userData = db.prepare(`SELECT status, approvalStatus, role FROM users WHERE email=?`).get(user.email) as any;
      
      if (!userData) {
        console.error("Google OAuth: User not found in database");
        return res.redirect("/login?error=user_not_found");
      }
      
      // בדוק אם המשתמש מאושר
      if (userData.approvalStatus !== 'approved' || userData.status !== 'active') {
        console.log("Google OAuth: User not approved:", user.email, "Status:", userData.status, "Approval:", userData.approvalStatus);
        return res.redirect("/login?error=pending_approval");
      }
      
      const token = signToken({ uid: user.uid, email: user.email, role: userData.role });
      setSessionCookie(res, token);
      
      console.log("Google OAuth: Token created, redirecting to /");
      res.redirect("/");
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/login?error=server_error");
    }
  }
);

