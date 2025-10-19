#!/usr/bin/env node

/**
 * סקריפט בדיקה למנגנון אישור משתמשים
 * מבדוק:
 * 1. שהמבנה של הטבלה תקין (approvalStatus, approvalToken)
 * 2. שההגדרות במערכת נכונות (ADMIN_EMAIL, SMTP)
 * 3. שהקוד של אישור משתמשים קיים
 * 4. שהפונקציות של שליחת מיילים קיימות
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 בדיקת מנגנון אישור משתמשים');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let hasErrors = false;

// ========================================
// 1. בדיקת קובץ DB
// ========================================
console.log('📂 בדיקת מסד נתונים...');

const dbPath = path.join(__dirname, 'tournaments.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('❌ שגיאה: קובץ tournaments.sqlite לא נמצא!');
  console.error(`   נתיב: ${dbPath}`);
  hasErrors = true;
} else {
  console.log(`✅ קובץ DB נמצא: ${dbPath}`);
}

// ========================================
// 2. בדיקת מבנה הטבלה
// ========================================
if (!hasErrors) {
  console.log('\n📋 בדיקת מבנה טבלת users...');
  
  const db = new Database(dbPath);
  const columns = db.prepare(`PRAGMA table_info(users)`).all();
  
  const columnNames = columns.map(col => col.name);
  
  const requiredColumns = [
    'id',
    'email',
    'passwordHash',
    'role',
    'approvalStatus',  // חדש!
    'approvalToken',   // חדש!
    'createdAt',
    'psnUsername'
  ];
  
  requiredColumns.forEach(col => {
    if (columnNames.includes(col)) {
      console.log(`✅ עמודה '${col}' קיימת`);
    } else {
      console.error(`❌ עמודה '${col}' חסרה!`);
      hasErrors = true;
    }
  });
  
  // ========================================
  // 3. בדיקת משתמשים קיימים
  // ========================================
  console.log('\n👥 בדיקת משתמשים...');
  
  const users = db.prepare(`SELECT email, role, approvalStatus FROM users`).all();
  
  console.log(`   מצאתי ${users.length} משתמשים במערכת:`);
  
  users.forEach((user, index) => {
    const status = user.approvalStatus || 'לא מוגדר';
    const statusIcon = status === 'approved' ? '✅' : status === 'pending' ? '⏳' : '❓';
    console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${statusIcon} ${status}`);
  });
  
  // בדיקת מנהל
  const admin = users.find(u => u.role === 'admin');
  if (admin) {
    console.log(`\n✅ נמצא מנהל: ${admin.email}`);
  } else {
    console.error('\n❌ לא נמצא משתמש מנהל במערכת!');
    hasErrors = true;
  }
  
  db.close();
}

// ========================================
// 4. בדיקת קבצי קוד
// ========================================
console.log('\n📦 בדיקת קבצי קוד...');

const requiredFiles = [
  'dist/routes/auth.js',
  'dist/routes/adminUsers.js',
  'dist/routes/approvalRequests.js',
  'dist/email.js',
  'dist/db.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ${file} חסר!`);
    hasErrors = true;
  }
});

// ========================================
// 5. בדיקת פונקציות במודול email
// ========================================
console.log('\n📧 בדיקת פונקציות מיילים...');

const emailPath = path.join(__dirname, 'dist/email.js');
if (fs.existsSync(emailPath)) {
  const emailContent = fs.readFileSync(emailPath, 'utf-8');
  
  const requiredFunctions = [
    'sendPendingApprovalEmail',      // מייל למשתמש שממתין לאישור
    'sendAdminApprovalRequest',      // מייל למנהל עם קישורי אישור
    'sendUserApprovedEmail',         // מייל למשתמש שאושר
    'sendPasswordResetEmail',
    'sendPasswordResetSuccessEmail'
  ];
  
  requiredFunctions.forEach(func => {
    if (emailContent.includes(`export async function ${func}`) || 
        emailContent.includes(`export function ${func}`) ||
        emailContent.includes(`function ${func}`)) {
      console.log(`✅ ${func}`);
    } else {
      console.error(`❌ ${func} חסרה!`);
      hasErrors = true;
    }
  });
}

// ========================================
// 6. בדיקת משתני סביבה
// ========================================
console.log('\n🔧 בדיקת משתני סביבה...');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ קובץ .env נמצא');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  const requiredEnvVars = [
    'ADMIN_EMAIL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
    'SITE_URL',
    'CORS_ORIGIN'
  ];
  
  requiredEnvVars.forEach(varName => {
    const found = envLines.find(line => line.trim().startsWith(`${varName}=`));
    if (found) {
      const value = found.split('=')[1]?.trim();
      if (value && value !== 'your-email@example.com' && !value.includes('example')) {
        console.log(`✅ ${varName} מוגדר`);
        
        // הצג ערכים חשובים
        if (varName === 'ADMIN_EMAIL') {
          console.log(`   → ${value}`);
        }
        if (varName === 'SITE_URL' || varName === 'CORS_ORIGIN') {
          console.log(`   → ${value}`);
        }
      } else {
        console.warn(`⚠️  ${varName} מוגדר אבל עם ערך דמה`);
        hasErrors = true;
      }
    } else {
      console.error(`❌ ${varName} חסר!`);
      hasErrors = true;
    }
  });
} else {
  console.error('❌ קובץ .env לא נמצא!');
  console.error(`   נתיב: ${envPath}`);
  hasErrors = true;
}

// ========================================
// 7. בדיקת routes באינדקס
// ========================================
console.log('\n🛣️  בדיקת routes באינדקס...');

const indexPath = path.join(__dirname, 'dist/index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  const requiredImports = [
    'adminUsers',
    'approvalRequests'
  ];
  
  requiredImports.forEach(imp => {
    if (indexContent.includes(imp)) {
      console.log(`✅ ${imp} מיובא`);
    } else {
      console.error(`❌ ${imp} לא מיובא!`);
      hasErrors = true;
    }
  });
  
  // בדיקת routes
  if (indexContent.includes('app.use("/api/admin", adminUsers)') || 
      indexContent.includes('app.use("/api/admin"')) {
    console.log('✅ adminUsers routes מחובר');
  } else {
    console.error('❌ adminUsers routes לא מחובר!');
    hasErrors = true;
  }
  
  if (indexContent.includes('app.use("/api/approval-requests"')) {
    console.log('✅ approval-requests routes מחובר');
  } else {
    console.error('❌ approval-requests routes לא מחובר!');
    hasErrors = true;
  }
}

// ========================================
// 8. בדיקת auth.ts - registerUser
// ========================================
console.log('\n🔐 בדיקת פונקציית registerUser...');

const authPath = path.join(__dirname, 'dist/auth.js');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf-8');
  
  // בדיקה שהפונקציה יוצרת approvalStatus ו-approvalToken
  if (authContent.includes('approvalStatus') && authContent.includes('approvalToken')) {
    console.log('✅ registerUser מטפלת באישור משתמשים');
  } else {
    console.error('❌ registerUser לא מטפלת באישור משתמשים!');
    hasErrors = true;
  }
}

// ========================================
// 9. סיכום
// ========================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 סיכום בדיקה');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (hasErrors) {
  console.error('❌ נמצאו שגיאות! מנגנון האישור לא יעבוד כראוי.');
  console.error('\n💡 המלצות לתיקון:');
  console.error('   1. הרץ: npm run build');
  console.error('   2. וודא ש-.env מוגדר נכון');
  console.error('   3. העלה את הקוד המעודכן לשרת');
  process.exit(1);
} else {
  console.log('✅ כל הבדיקות עברו בהצלחה!');
  console.log('\n🎉 מנגנון אישור המשתמשים מוכן לעבודה!');
  console.log('\n📝 מה קורה כאשר משתמש חדש נרשם:');
  console.log('   1. המשתמש נוצר עם סטטוס "pending"');
  console.log('   2. המשתמש לא יכול להתחבר עד לאישור');
  console.log('   3. המשתמש מקבל מייל שהוא ממתין לאישור');
  console.log('   4. המנהל מקבל מייל עם כפתורי אישור/דחייה');
  console.log('   5. לאחר אישור - המשתמש מקבל מייל ויכול להתחבר');
  process.exit(0);
}

