# הגדרות SMTP - מדריך מלא

## סקירה כללית

הפרויקט משתמש ב-**nodemailer** לשליחת מיילים. התצורה זהה בין:
- ✅ `test-send.js` (סקריפט בדיקה)
- ✅ `src/email.ts` (קוד הפרודקשן)

## משתני סביבה נדרשים

הוסף לקובץ `.env` בשורש הפרויקט:

```bash
# SMTP - שליחת מיילים
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="FC Masters Cup <noreply@fcmasterscup.com>"
```

## הגדרת Gmail SMTP

### שלב 1: הפעלת 2FA
1. עבור ל-https://myaccount.google.com/security
2. הפעל "2-Step Verification"

### שלב 2: יצירת App Password
1. עבור ל-https://myaccount.google.com/apppasswords
2. בחר "Mail" ו-"Windows Computer" (או Other)
3. לחץ "Generate"
4. העתק את הסיסמה (16 תווים)
5. השתמש בה כ-`SMTP_PASS` ב-.env

### שלב 3: הגדרות ב-.env

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587                          # או 465 עם SMTP_SECURE=true
SMTP_SECURE=false                      # false ל-587, true ל-465
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx         # App Password מגוגל (בלי רווחים!)
EMAIL_FROM="FC Masters Cup <noreply@fcmasterscup.com>"
```

**חשוב**: הסר רווחים מה-App Password!
```bash
# ❌ שגוי:
SMTP_PASS=abcd efgh ijkl mnop

# ✅ נכון:
SMTP_PASS=abcdefghijklmnop
```

## אפשרויות תצורה

### SMTP_PORT ו-SMTP_SECURE

| Port | Secure | Protocol | שימוש                    |
|------|--------|----------|--------------------------|
| 587  | false  | STARTTLS | מומלץ לרוב השירותים       |
| 465  | true   | SSL/TLS  | Gmail ישן, Outlook       |
| 25   | false  | None     | לא מומלץ (לא מאובטח)      |

**המלצה**: השתמש ב-`587` עם `SMTP_SECURE=false`

### EMAIL_FROM

```bash
# אפשרות 1 - עם שם תצוגה:
EMAIL_FROM="FC Masters Cup <noreply@fcmasterscup.com>"

# אפשרות 2 - רק כתובת:
EMAIL_FROM=noreply@fcmasterscup.com

# אפשרות 3 - השתמש ב-SMTP_USER (fallback):
# (השאר ריק או אל תגדיר)
```

## בדיקת תצורה

### 1. השוואת תצורה
```bash
cd server
node compare-smtp-config.mjs
```
זה יראה לך:
- ✅ איזה משתנים מוגדרים
- ✅ איזה ערכים יש להם
- ✅ אם התצורה תקינה

### 2. בדיקת שליחת מייל
```bash
node test-send.js
```
זה ישלח מייל בדיקה ל-`yosiyoviv@gmail.com`.

### 3. בדיקת forgot-password
```bash
node test-forgot-password-manual.mjs your-email@example.com
```

## פתרון בעיות נפוצות

### שגיאה: "Invalid login"
**סיבה**: SMTP_USER או SMTP_PASS שגויים

**פתרון**:
1. ודא ש-SMTP_USER הוא האימייל המלא
2. השתמש ב-App Password, לא בסיסמה הרגילה
3. הסר רווחים מה-App Password
4. ודא ש-2FA מופעל

### שגיאה: "Connection timeout"
**סיבה**: פורט חסום או הגדרות שגויות

**פתרון**:
1. נסה SMTP_PORT=587 עם SMTP_SECURE=false
2. או SMTP_PORT=465 עם SMTP_SECURE=true
3. בדוק firewall/antivirus

### שגיאה: "Self signed certificate"
**סיבה**: בעיית SSL certificate

**פתרון**: הוסף ל-`email.ts`:
```typescript
tls: {
  rejectUnauthorized: false
}
```

### המייל לא מגיע (אבל אין שגיאות)
**בדיקות**:
1. בדוק Spam/Junk
2. ודא שהכתובת נכונה
3. בדוק quota ב-Gmail (500/day)
4. בדוק Gmail "Sent" folder

### "SMTP credentials not configured"
**סיבה**: חסרים SMTP_USER או SMTP_PASS

**פתרון**:
```bash
# בדוק שה-.env נטען:
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.SMTP_USER)"

# אם מחזיר undefined:
# 1. צור .env מ-env.example
# 2. ודא שה-.env בשורש הפרויקט (לא ב-server/)
```

## שירותי SMTP נוספים

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## תצורה מתקדמת

### הוספת לוגים (debug)

ערוך `email.ts`:
```typescript
const emailConfig = {
  // ... הגדרות קיימות
  logger: true,  // הפעל logging
  debug: true,   // הפעל debug mode
};
```

### Pool connection (לביצועים)
```typescript
const emailConfig = {
  // ... הגדרות קיימות
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
};
```

## סיכום

1. ✅ התצורה זהה בין `test-send.js` ל-`email.ts`
2. ✅ השתמש ב-Gmail App Password, לא בסיסמה רגילה
3. ✅ מומלץ: Port 587, Secure=false
4. ✅ בדוק תצורה: `node compare-smtp-config.mjs`
5. ✅ בדוק שליחה: `node test-send.js`

**עזרה נוספת**: ראה [SETUP-GMAIL-SMTP.md](../SETUP-GMAIL-SMTP.md)

