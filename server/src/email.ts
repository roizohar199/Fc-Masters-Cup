import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // תצורת SMTP זהה ל-test-send.js
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  
  const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpSecure, // קורא מ-SMTP_SECURE environment variable
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false, // לוגים ב-test-send.js בלבד
    debug: false,  // debug ב-test-send.js בלבד
  };
  
  // אם אין הגדרות SMTP, נשתמש במצב פיתוח (לוג בלבד)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn("[email] ⚠️ SMTP credentials not configured. Email will be logged only.");
    console.log("[email] Expected env vars: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM");
    return null;
  }
  
  console.log("[email] 📧 Creating SMTP transporter with config:");
  console.log('Got hereeee12345');
  console.log(`  Host: ${emailConfig.host}`);
  console.log(`  Port: ${emailConfig.port}`);
  console.log(`  Secure: ${emailConfig.secure}`);
  console.log(`  User: ${emailConfig.auth.user}`);
  console.log(`  Pass: ${emailConfig.auth.pass ? '***' + emailConfig.auth.pass.slice(-4) : 'NOT_SET'}`);
  
  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
}

export async function sendWelcomeEmail(email: string) {
  const transport = getTransporter();
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "ברוכים הבאים ל-FC Masters Cup! ⚽",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            ⚽ ברוכים הבאים ל-FC Masters Cup!
          </h1>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום <strong>${email}</strong>,<br><br>
              ההרשמה שלך לאתר FC Masters Cup הושלמה בהצלחה! 🎉
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #764ba2; font-size: 22px; margin-bottom: 15px;">📋 מה הלאה?</h2>
            <ul style="color: #555; font-size: 16px; line-height: 2;">
              <li>עקוב אחר עדכוני הטורנירים הקרובים באתר</li>
              <li>הכן את הקונסולה והכישורים שלך ל-FC25/FC26</li>
              <li>התכונן להתחרות מול השחקנים הטובים ביותר</li>
              <li>שים לב להוראות הגשת תוצאות - חובה להעלות וידאו!</li>
            </ul>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border: 2px solid #ff9800; margin: 20px 0;">
            <p style="color: #e65100; font-size: 15px; margin: 0; font-weight: 600;">
              ⚠️ חשוב לדעת:
            </p>
            <p style="color: #5d4037; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              בכל משחק יש להעלות וידאו של המחצית השנייה כהוכחה לניצחון. 
              אי העלאת הוכחה תגרור פסילה מהמשחק ללא החזר כספי.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              כניסה לאתר 🎮
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              בהצלחה בטורנירים הקרובים! 🏆
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Welcome email (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendAdminNotification(adminEmail: string, user: { email: string; psnUsername?: string; createdAt: string }) {
  const transport = getTransporter();
  
  const registrationDate = new Date(user.createdAt).toLocaleString("he-IL", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: "משתמש חדש נרשם לאתר! 🎉",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            👤 משתמש חדש נרשם!
          </h1>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              משתמש חדש הצטרף לאתר FC Masters Cup:
            </p>
            <p style="font-size: 24px; font-weight: 700; color: #667eea; margin: 15px 0;">
              ${user.email}
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #495057; font-size: 18px; margin: 0 0 15px 0;">📋 פרטי המשתמש:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">📧 אימייל:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${user.email}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🎮 שם PSN:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${user.psnUsername || 'לא הוזן'}</p>
              </div>
              <div style="grid-column: span 2;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🕒 זמן הרשמה:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${registrationDate}</p>
              </div>
            </div>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #764ba2; font-size: 20px; margin-bottom: 15px;">📊 פעולות מומלצות:</h2>
            <ul style="color: #555; font-size: 16px; line-height: 2;">
              <li>כנס לפאנל הניהול ובדוק את פרטי המשתמש</li>
              <li>וודא שהמשתמש מאושר לטורנירים</li>
              <li>שלח הודעת ברכה בקבוצת הטלגרם</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}/admin" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              פאנל ניהול 👨‍💼
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Admin notification (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Admin notification sent to: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send admin notification:`, error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const transport = getTransporter();
  const encodedEmail = encodeURIComponent(email);
  const resetUrl = `${process.env.SITE_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${encodedEmail}`;
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "איפוס סיסמה - FC Masters Cup 🔑",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🔑 איפוס סיסמה
          </h1>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0;">
              קיבלנו בקשה לאיפוס הסיסמה שלך באתר FC Masters Cup.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              איפוס סיסמה 🔄
            </a>
          </div>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 10px; border: 2px solid #ff9800; margin: 20px 0;">
            <p style="color: #e65100; font-size: 14px; margin: 0;">
              ⚠️ הקישור תקף למשך 30 דקות בלבד
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
              אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה.
              הסיסמה שלך תישאר ללא שינוי.
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Password reset email (dev mode):", resetUrl);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendPendingApprovalEmail(email: string) {
  const transport = getTransporter();
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "ההרשמה שלך ממתינה לאישור - FC Masters Cup ⏳",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            ⏳ ההרשמה שלך ממתינה לאישור
          </h1>
          
          <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #ff9800;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום <strong>${email}</strong>,<br><br>
              תודה שנרשמת ל-FC Masters Cup! 🎉
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #ff9800; font-size: 22px; margin-bottom: 15px;">📋 מה קורה עכשיו?</h2>
            <ul style="color: #555; font-size: 16px; line-height: 2;">
              <li>ההרשמה שלך נקלטה במערכת בהצלחה</li>
              <li>המנהל קיבל הודעה ויאשר את חשבונך בהקדם</li>
              <li>תקבל מייל נוסף ברגע שהחשבון שלך יאושר</li>
              <li>לאחר האישור תוכל להתחבר ולהשתתף בטורנירים</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; border: 2px solid #2196F3; margin: 20px 0;">
            <p style="color: #1976D2; font-size: 15px; margin: 0; font-weight: 600;">
              ℹ️ למה צריך אישור?
            </p>
            <p style="color: #1565C0; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              כדי לשמור על רמה גבוהה של התחרות ולמנוע משתמשים לא רצויים, 
              כל משתמש חדש עובר אישור ידני של המנהל.
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              נתראה בקרוב בטורנירים! 🏆
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Pending approval email (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Pending approval email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendAdminApprovalRequest(adminEmail: string, user: { email: string; psnUsername?: string; createdAt: string; approvalToken: string }) {
  const transport = getTransporter();
  
  const registrationDate = new Date(user.createdAt).toLocaleString("he-IL", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const approvalUrl = `${process.env.SITE_URL || "http://localhost:5173"}/api/admin/approve-user?token=${user.approvalToken}`;
  const rejectUrl = `${process.env.SITE_URL || "http://localhost:5173"}/api/admin/reject-user?token=${user.approvalToken}`;
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: "משתמש חדש ממתין לאישור! 👤⏳",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            👤 משתמש חדש ממתין לאישור!
          </h1>
          
          <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #ff9800;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              משתמש חדש נרשם לאתר FC Masters Cup וממתין לאישורך:
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #495057; font-size: 18px; margin: 0 0 15px 0;">📋 פרטי המשתמש:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">📧 אימייל:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${user.email}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🎮 שם PSN:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${user.psnUsername || 'לא הוזן'}</p>
              </div>
              <div style="grid-column: span 2;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🕒 זמן הרשמה:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${registrationDate}</p>
              </div>
            </div>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #764ba2; font-size: 20px; margin-bottom: 15px;">⚡ פעולות מהירות:</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <a href="${approvalUrl}" 
                 style="display: block; padding: 16px 24px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4); text-align: center;">
                ✅ אשר משתמש
              </a>
              <a href="${rejectUrl}" 
                 style="display: block; padding: 16px 24px; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4); text-align: center;">
                ❌ דחה משתמש
              </a>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; border: 2px solid #2196F3; margin: 20px 0;">
            <p style="color: #1976D2; font-size: 14px; margin: 0; font-weight: 600;">
              💡 טיפ: תוכל גם לאשר/לדחות משתמשים ישירות מפאנל הניהול
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}/admin" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              פאנל ניהול 👨‍💼
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Admin approval request (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Admin approval request sent to: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send admin approval request:`, error);
    return false;
  }
}

export async function sendPasswordResetSuccessEmail(email: string) {
  const transport = getTransporter();
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "הסיסמה שלך אופסה בהצלחה - FC Masters Cup ✅",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #28a745; text-align: center; font-size: 32px; margin-bottom: 20px;">
            ✅ הסיסמה אופסה בהצלחה!
          </h1>
          
          <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #28a745;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום <strong>${email}</strong>,<br><br>
              הסיסמה שלך אופסה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.
            </p>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border: 2px solid #ff9800; margin: 20px 0;">
            <p style="color: #e65100; font-size: 15px; margin: 0; font-weight: 600;">
              ⚠️ חשוב לדעת:
            </p>
            <p style="color: #5d4037; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              אם לא ביצעת את איפוס הסיסמה, אנא צור קשר איתנו מיד.
              ייתכן שמישהו אחר ניסה לגשת לחשבון שלך.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);">
              כניסה לאתר 🎮
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Password reset success email (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Password reset success email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendTournamentRegistrationEmail(params: {
  tournamentTitle: string;
  userName?: string;
  userEmail: string;
  count: number;
  capacity: number;
}) {
  const { tournamentTitle, userName, userEmail, count, capacity } = params;
  const adminEmail = process.env.ADMIN_EMAIL || 'roizohar111@gmail.com';
  const transport = getTransporter();

  const subject = `נרשם חדש לטורניר: ${tournamentTitle} (${count}/${capacity})`;
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            ⚽ נרשם חדש לטורניר!
          </h1>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום רועי,<br><br>
              יש נרשם חדש לטורניר "<strong>${tournamentTitle}</strong>".
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #495057; font-size: 18px; margin: 0 0 15px 0;">📋 פרטי המשתתף:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">👤 שם:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${userName || 'ללא שם'}</p>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">📧 אימייל:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${userEmail || 'לא צוין'}</p>
              </div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #28a745;">
            <p style="font-size: 20px; color: #28a745; margin: 0; font-weight: 700; text-align: center;">
              📊 סה"כ נרשמו: ${count}/${capacity}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}/admin" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              פאנל ניהול 👨‍💼
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };

  if (!transport) {
    console.log("[email] 📧 Tournament registration email (dev mode):", emailContent);
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Tournament registration email sent to admin`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send tournament registration email:`, error);
    return false;
  }
}

export async function sendTournamentSelectionEmail(params: {
  userEmail: string;
  userName?: string;
  tournamentTitle: string;
  tournamentDate?: string;
  telegramLink?: string;
  prizeFirst: number;
  prizeSecond: number;
}) {
  const { userEmail, userName, tournamentTitle, tournamentDate, telegramLink, prizeFirst, prizeSecond } = params;
  const transport = getTransporter();

  const subject = `🎉 נבחרת להשתתף בטורניר: ${tournamentTitle}`;
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #28a745; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🎉 מזל טוב! נבחרת להשתתף!
          </h1>
          
          <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #28a745;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום <strong>${userName || userEmail}</strong>,<br><br>
              <strong>נבחרת להשתתף בטורניר "${tournamentTitle}"!</strong> 🏆
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #495057; font-size: 18px; margin: 0 0 15px 0;">📋 פרטי הטורניר:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🏆 שם הטורניר:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${tournamentTitle}</p>
              </div>
              ${tournamentDate ? `
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">📅 תאריך:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${tournamentDate}</p>
              </div>
              ` : ''}
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🥇 פרס ראשון:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${prizeFirst} ₪</p>
              </div>
              <div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">🥈 פרס שני:</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">${prizeSecond} ₪</p>
              </div>
            </div>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #667eea; font-size: 22px; margin-bottom: 15px;">📋 מה הלאה?</h2>
            <ul style="color: #555; font-size: 16px; line-height: 2;">
              <li>הטורניר יתחיל בקרוב - הישאר ערני לעדכונים</li>
              <li>הכן את הקונסולה והכישורים שלך ל-FC25/FC26</li>
              <li>התכונן להתחרות מול השחקנים הטובים ביותר</li>
              <li>שים לב להוראות הגשת תוצאות - חובה להעלות וידאו!</li>
            </ul>
          </div>
          
          ${telegramLink ? `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 10px; border: 2px solid #0288d1; margin: 20px 0;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 28px;">💬</div>
                <div>
                  <h3 style="color: #01579b; font-size: 18px; margin: 0;">הצטרף לקבוצת הטלגרם</h3>
                  <p style="color: #0277bd; font-size: 14px; margin: 4px 0 0 0;">קבל עדכונים ושוחח עם שחקנים אחרים</p>
                </div>
              </div>
              <a href="${telegramLink}" target="_blank" rel="noopener noreferrer" style="padding: 12px 24px; background: #0288d1; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center;">
                הצטרף 📱
              </a>
            </div>
          </div>
          ` : ''}
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border: 2px solid #ff9800; margin: 20px 0;">
            <p style="color: #e65100; font-size: 15px; margin: 0; font-weight: 600;">
              ⚠️ חשוב לדעת:
            </p>
            <p style="color: #5d4037; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              בכל משחק יש להעלות וידאו של המחצית השנייה כהוכחה לניצחון. 
              אי העלאת הוכחה תגרור פסילה מהמשחק ללא החזר כספי.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              כניסה לאתר 🎮
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              בהצלחה בטורניר! 🏆
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };

  if (!transport) {
    console.log("[email] 📧 Tournament selection email (dev mode):", emailContent);
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Tournament selection email sent to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send tournament selection email:`, error);
    return false;
  }
}

export async function sendUserApprovedEmail(email: string) {
  const transport = getTransporter();
  
  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "החשבון שלך אושר! ברוכים הבאים ל-FC Masters Cup! 🎉⚽",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #28a745; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🎉 החשבון שלך אושר!
          </h1>
          
          <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #28a745;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              שלום <strong>${email}</strong>,<br><br>
              המנהל אישר את החשבון שלך! ברוכים הבאים ל-FC Masters Cup! 🏆
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #764ba2; font-size: 22px; margin-bottom: 15px;">📋 מה הלאה?</h2>
            <ul style="color: #555; font-size: 16px; line-height: 2;">
              <li>כעת תוכל להתחבר לאתר עם האימייל והסיסמה שלך</li>
              <li>עקוב אחר עדכוני הטורנירים הקרובים</li>
              <li>הכן את הקונסולה והכישורים שלך ל-FC25/FC26</li>
              <li>התכונן להתחרות מול השחקנים הטובים ביותר</li>
              <li>שים לב להוראות הגשת תוצאות - חובה להעלות וידאו!</li>
            </ul>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border: 2px solid #ff9800; margin: 20px 0;">
            <p style="color: #e65100; font-size: 15px; margin: 0; font-weight: 600;">
              ⚠️ חשוב לדעת:
            </p>
            <p style="color: #5d4037; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              בכל משחק יש להעלות וידאו של המחצית השנייה כהוכחה לניצחון. 
              אי העלאת הוכחה תגרור פסילה מהמשחק ללא החזר כספי.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.SITE_URL || "http://localhost:5173"}" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              כניסה לאתר 🎮
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 5px 0;">
              בהצלחה בטורנירים הקרובים! 🏆
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              FC Masters Cup • PS5 • FC25/FC26
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 User approved email (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ User approved email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendEarlyRegistrationEmail({ userEmail, userPsn, tournamentTitle, totalCount }: {
  userEmail: string;
  userPsn: string;
  tournamentTitle: string;
  totalCount: number;
}) {
  const transport = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.log("[email] No admin email configured, skipping early registration notification");
    return true;
  }

  const emailContent = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"FC Masters Cup" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: "🎮 משתמש חדש מביע עניין בטורניר!",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="color: #667eea; text-align: center; font-size: 32px; margin-bottom: 20px;">
            🎮 משתמש חדש מביע עניין!
          </h1>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              משתמש חדש לחץ על "אני בפנים!" בטורניר:
            </p>
            <p style="font-size: 24px; font-weight: 700; color: #667eea; margin: 15px 0;">
              ${tournamentTitle}
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">פרטי המשתמש:</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>אימייל:</strong> ${userEmail}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>שם PSN:</strong> ${userPsn}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>זמן:</strong> ${new Date().toLocaleString("he-IL")}</p>
          </div>

          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">📊 אינדיקציה לפתיחת טורניר</h3>
            <p style="color: white; margin: 0; font-size: 16px;">
              זהו רישום מוקדם - המשתמש מביע עניין להשתתף בטורניר
            </p>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px; font-weight: 700;">
              ככל שיותר משתמשים ילחצו "אני בפנים!", כך תוכל להבין אם כדאי לפתוח טורניר חדש!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              FC Masters Cup - מערכת ניהול טורנירים
            </p>
          </div>
        </div>
      </div>
    `,
  };
  
  if (!transport) {
    console.log("[email] 📧 Early registration email (dev mode):", emailContent);
    return true;
  }
  
  try {
    await transport.sendMail(emailContent);
    console.log(`[email] ✅ Early registration email sent to: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Failed to send early registration email:`, error);
    return false;
  }
}

