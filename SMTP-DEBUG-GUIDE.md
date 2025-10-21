# 📧 מדריך אבחון ותיקון בעיות SMTP - FC Masters Cup

## ✅ השלמת התקנה

כל הקבצים והמערכות הוכנו בהצלחה:

1. ✅ **טבלת לוגים** - `email_logs` נוצרה במסד הנתונים
2. ✅ **mailer.ts** - עודכן עם אימות SMTP ולוגים
3. ✅ **smtp.routes.ts** - ראוטי בדיקה חדש למנהלים
4. ✅ **index.ts** - מחובר לראוטי SMTP + לוג הגדרות בעלייה
5. ✅ **routes.ts & selection.ts** - עודכנו להשתמש ב-sendMailSafe

---

## 🔍 בדיקות מהירות (בסביבת פיתוח)

### 1️⃣ בדיקת אימות SMTP
```bash
# Windows (PowerShell):
Invoke-WebRequest -Uri "http://localhost:8787/api/admin/smtp/verify" -Headers @{"Cookie"="your-auth-cookie"}

# Linux/Mac:
curl -sS http://localhost:8787/api/admin/smtp/verify -H "Cookie: your-auth-cookie"
```

**תגובה צפויה:**
```json
{"ok": true}
```

אם קיבלת `{"ok": false, "error": "..."}` - בדוק את הגדרות SMTP ב-`.env`.

---

### 2️⃣ שליחת מייל בדיקה
```bash
# Windows (PowerShell):
$body = @{ to = "your-email@gmail.com" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8787/api/admin/smtp/test" -Method POST -ContentType "application/json" -Body $body -Headers @{"Cookie"="your-auth-cookie"}

# Linux/Mac:
curl -sS -X POST http://localhost:8787/api/admin/smtp/test \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"to":"your-email@gmail.com"}'
```

**תגובה צפויה:**
```json
{"ok": true, "messageId": "..."}
```

---

### 3️⃣ בדיקת לוגים במסד הנתונים
```bash
# Windows (PowerShell) - אם יש sqlite3:
sqlite3 server/tournaments.sqlite "SELECT id, to_email, subject, status, substr(error,1,60), created_at FROM email_logs ORDER BY id DESC LIMIT 10;"

# Node.js (כל מערכת):
node -e "const db=require('better-sqlite3')('server/tournaments.sqlite'); console.table(db.prepare('SELECT * FROM email_logs ORDER BY id DESC LIMIT 10').all()); db.close();"
```

---

## 🛠️ צ'ק-ליסט לפתרון בעיות

### ❌ אם לא מגיעים מיילים:

#### 1. 🔑 **בדיקת הגדרות Gmail**
- ✅ האם 2FA (אימות דו-שלבי) מופעל בחשבון Google?
- ✅ האם יצרת **סיסמת אפליקציה** (App Password)?
  - לא ניתן להשתמש בסיסמת Gmail רגילה!
  - ליצירת סיסמת אפליקציה: https://myaccount.google.com/apppasswords
- ✅ האם `SMTP_USER` תואם ל-`EMAIL_FROM`?

#### 2. 🌐 **בדיקת הגדרות .env**
קובץ: `server/.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here  # 16 תווים ללא רווחים
EMAIL_FROM="FC Masters Cup <your-email@gmail.com>"
SITE_URL=https://www.k-rstudio.com
```

**חשוב:**
- פורט 587 → `SMTP_SECURE=false` (STARTTLS)
- פורט 465 → `SMTP_SECURE=true` (SSL)

#### 3. 🛡️ **בדיקת Firewall/VPS**
אם אתה על VPS (Hostinger, DigitalOcean וכו'):
- וודא שיציאות יוצאות 587 ו-465 **פתוחות**
- חלק מספקי VPS חוסמים יציאות אלו כברירת מחדל

```bash
# בדיקה ב-Linux:
telnet smtp.gmail.com 587
# אם מקבל "Connected" - היציאה פתוחה
```

#### 4. 📨 **בדיקת שגיאות Gmail**
- לפעמים Gmail חוסם sign-in חדש מאפליקציה
- בדוק את תיבת הדואר של `SMTP_USER` - יכול להיות מייל "Suspicious sign-in prevented"
- אם יש - אשר את הגישה ונסה שוב

#### 5. 🔄 **Rate Limit / Quota**
- Gmail מגביל לכ-100-500 מיילים ביום (תלוי בחשבון)
- אם שלחת הרבה מיילים ביום אחד - יכול להיות שהגעת למכסה
- פתרון: חכה 24 שעות או שדרג ל-Google Workspace

---

## 📊 בדיקת לוגים בשרת

### לוגי שרת (בעת עלייה):
```
📧 SMTP Configuration:
  - Host: smtp.gmail.com
  - Port: 587
  - Secure: false
  - From: FC Masters Cup <your-email@gmail.com>
```

אם לא רואה את זה בלוג - ה-`.env` לא נטען!

### לוגי מיילים (מסד נתונים):
```sql
SELECT 
  id, 
  to_email, 
  subject, 
  status, 
  error, 
  created_at 
FROM email_logs 
WHERE status = 'ERROR'
ORDER BY created_at DESC;
```

---

## 🚀 העלאה לפרודקשן (VPS)

### 1. העתק קבצים לשרת:
```bash
# מ-Windows ל-Linux VPS:
scp -r server/migrations/2025_10_21_email_logs.sql user@your-vps:/var/www/fc-masters-cup/server/migrations/
scp -r server/src/modules/ user@your-vps:/var/www/fc-masters-cup/server/src/
```

### 2. הרץ migration בשרת:
```bash
ssh user@your-vps
cd /var/www/fc-masters-cup
node server/migrations/run_email_logs_migration.js  # אם שמרת את הקובץ
# או:
sqlite3 server/tournaments.sqlite < server/migrations/2025_10_21_email_logs.sql
```

### 3. עדכן .env בפרודקשן:
```bash
ssh user@your-vps
nano /var/www/fc-masters-cup/server/.env
# הוסף/עדכן הגדרות SMTP כמו למעלה
```

### 4. הפעל מחדש את השרת:
```bash
pm2 restart fc-masters-cup
# או:
systemctl restart fc-masters-cup
```

### 5. בדוק לוגים:
```bash
pm2 logs fc-masters-cup --lines 50
# חפש את:
# 📧 SMTP Configuration:
```

---

## 🧪 בדיקה מקצה לקצה

### זרימת עבודה מלאה:
1. משתמש נרשם → `sendWelcomeEmail` (מ-`email.ts`)
2. מנהל בוחר שחקנים לטורניר → `sendMailSafe` (מ-`selection.ts`)
3. מנהל שולח מייל ידני → `sendMailSafe` (מ-`admin/routes.ts`)

### בדיקה:
```bash
# 1. בדוק ש-SMTP עובד:
curl http://localhost:8787/api/admin/smtp/verify -H "Cookie: ..."

# 2. שלח מייל בדיקה:
curl -X POST http://localhost:8787/api/admin/smtp/test \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{"to":"test@gmail.com"}'

# 3. בדוק את הלוג:
sqlite3 server/tournaments.sqlite "SELECT * FROM email_logs ORDER BY id DESC LIMIT 1;"
```

---

## 🆘 בעיות נפוצות

### ❌ "connect ETIMEDOUT"
- **בעיה:** שרת לא יכול להתחבר ל-smtp.gmail.com
- **פתרון:** בדוק Firewall, וודא שיציאה 587/465 פתוחה

### ❌ "Invalid login: 535-5.7.8 Username and Password not accepted"
- **בעיה:** סיסמה שגויה או לא סיסמת אפליקציה
- **פתרון:** צור סיסמת אפליקציה חדשה ועדכן ב-`.env`

### ❌ "self signed certificate in certificate chain"
- **בעיה:** בעיה בתעודת SSL
- **פתרון:** הוסף ל-`mailer.ts`:
  ```ts
  tls: {
    rejectUnauthorized: false
  }
  ```

### ❌ "Greeting never received"
- **בעיה:** Timeout בחיבור
- **פתרון:** נסה פורט 465 עם `SMTP_SECURE=true`

---

## 📞 תמיכה נוספת

אם הבעיה נמשכת:
1. בדוק לוגי `email_logs` בטבלה - יש שם את השגיאה המדויקת
2. הפעל debug mode ב-`mailer.ts`:
   ```ts
   logger: true,
   debug: true,
   ```
3. הרץ `verifySmtp()` ישירות וראה את השגיאה המדויקת

---

**עודכן:** 21 אוקטובר 2025  
**גרסה:** 1.0

