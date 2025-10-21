#!/usr/bin/env node
/**
 * סקריפט בדיקה מהירה למערכת המיילים
 * 
 * שימוש:
 * node test-email-system.mjs
 * 
 * מה זה בודק:
 * 1. טעינת .env והצגת הגדרות SMTP
 * 2. בדיקת חיבור SMTP
 * 3. שליחת מייל טסט (אופציונלי)
 * 4. בדיקת טבלת email_logs
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import Database from 'better-sqlite3';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('═'.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(60), 'cyan');
}

async function main() {
  log('\n🔍 FC Masters Cup - בדיקת מערכת מיילים\n', 'bright');

  // 1. הצגת הגדרות
  section('1️⃣ הגדרות SMTP מתוך .env');
  
  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_SECURE: process.env.SMTP_SECURE || 'false',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT_SET',
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL,
  };

  Object.entries(config).forEach(([key, value]) => {
    const status = value && value !== 'NOT_SET' ? '✓' : '✗';
    const color = value && value !== 'NOT_SET' ? 'green' : 'red';
    log(`  ${status} ${key}: ${value}`, color);
  });

  // בדיקות אזהרה
  if (!process.env.SMTP_USER) {
    log('\n  ⚠️  SMTP_USER לא מוגדר - המיילים לא ישלחו!', 'red');
  }
  if (!process.env.SMTP_PASS) {
    log('  ⚠️  SMTP_PASS לא מוגדר - המיילים לא ישלחו!', 'red');
  }
  if (!process.env.ADMIN_EMAIL && !process.env.ADMIN_EMAILS) {
    log('  ⚠️  ADMIN_EMAILS לא מוגדר - המנהל לא יקבל התראות!', 'yellow');
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    log('\n❌ לא ניתן להמשיך ללא הגדרות SMTP. ערוך את קובץ .env והוסף:\n', 'red');
    log('SMTP_USER=your-email@gmail.com', 'yellow');
    log('SMTP_PASS=your-app-password-here', 'yellow');
    log('ADMIN_EMAILS=your-email@gmail.com\n', 'yellow');
    process.exit(1);
  }

  // 2. בדיקת חיבור SMTP
  section('2️⃣ בדיקת חיבור SMTP');
  
  const host = config.SMTP_HOST;
  const port = Number(config.SMTP_PORT);
  const secure = String(config.SMTP_SECURE).toLowerCase() === 'true';
  
  log(`  מתחבר ל-${host}:${port} (secure: ${secure})...`, 'cyan');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 1,
  });

  try {
    await transporter.verify();
    log('  ✅ חיבור SMTP הצליח!', 'green');
  } catch (error) {
    log(`  ❌ חיבור SMTP נכשל: ${error.message}`, 'red');
    log('\n  פתרונות אפשריים:', 'yellow');
    log('    1. וודא ש-SMTP_PASS הוא App Password (16 תווים)', 'yellow');
    log('    2. בדוק ש-2FA מופעל בחשבון Gmail', 'yellow');
    log('    3. נסה פורט 465 עם SMTP_SECURE=true', 'yellow');
    log('    4. בדוק שהפורט לא חסום על ידי הספק\n', 'yellow');
    process.exit(1);
  }

  // 3. בדיקת טבלת email_logs
  section('3️⃣ בדיקת טבלת email_logs');
  
  const dbPath = process.env.DB_PATH || './server/tournaments.sqlite';
  log(`  נתיב DB: ${dbPath}`, 'cyan');
  
  try {
    const db = new Database(dbPath);
    
    // יצירת טבלה אם לא קיימת
    db.prepare(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        message_id TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // ספירת רשומות
    const count = db.prepare('SELECT COUNT(*) as count FROM email_logs').get();
    log(`  ✅ טבלת email_logs קיימת (${count.count} רשומות)`, 'green');

    // הצגת 5 אחרונים
    if (count.count > 0) {
      const recent = db.prepare(
        'SELECT to_email, subject, status, created_at FROM email_logs ORDER BY id DESC LIMIT 5'
      ).all();
      
      log('\n  📧 5 מיילים אחרונים:', 'cyan');
      recent.forEach((row, i) => {
        const icon = row.status === 'SENT' ? '✅' : '❌';
        log(`    ${i+1}. ${icon} ${row.subject} → ${row.to_email} (${row.created_at})`, 
            row.status === 'SENT' ? 'green' : 'red');
      });
    }
    
    db.close();
  } catch (error) {
    log(`  ⚠️  שגיאה בגישה ל-DB: ${error.message}`, 'yellow');
  }

  // 4. שליחת מייל טסט (אופציונלי)
  section('4️⃣ שליחת מייל טסט');
  
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    log('  ⏭️  דילוג - אין כתובות מנהלים מוגדרות', 'yellow');
  } else {
    log(`  שולח מייל טסט ל-${adminEmails.length} מנהל/ים...`, 'cyan');
    
    for (const email of adminEmails) {
      try {
        const info = await transporter.sendMail({
          from: config.EMAIL_FROM,
          to: email,
          subject: '🧪 בדיקת SMTP - FC Masters Cup',
          html: `
            <div dir="rtl" style="font-family:Arial; padding:20px; background:#f5f5f5; border-radius:8px;">
              <h2 style="color:#667eea;">✅ SMTP עובד!</h2>
              <p>אם קיבלת מייל זה, המערכת מוגדרת כראוי.</p>
              <hr/>
              <small>זמן בדיקה: ${new Date().toLocaleString('he-IL')}</small>
            </div>
          `
        });
        
        log(`  ✅ נשלח ל-${email} (Message ID: ${info.messageId})`, 'green');
      } catch (error) {
        log(`  ❌ נכשל שליחה ל-${email}: ${error.message}`, 'red');
      }
    }
  }

  // סיכום
  section('✅ סיכום');
  log('  בדיקת SMTP הושלמה!', 'green');
  log('\n  צעדים הבאים:', 'cyan');
  log('    1. אם המייל הגיע - הכל תקין! ✅', 'green');
  log('    2. אם לא - בדוק SPAM/Promotions בתיבת המייל', 'yellow');
  log('    3. כנס לשרת וראה: pm2 logs fc-masters-cup --lines 50', 'cyan');
  log('    4. בדוק דרך הדפדפן: /api/admin/smtp/verify', 'cyan');
  log('    5. ראה מדריך מפורט: EMAIL-DIAGNOSTICS-GUIDE.md\n', 'cyan');
}

main().catch(err => {
  log(`\n💥 שגיאה קריטית: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

