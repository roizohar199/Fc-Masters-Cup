# מדריך אבחון מיילים - FC Masters Cup

## 🎯 מטרה
לאבחן ולפתור מצב שבו מיילים לא מגיעים ל-fcmasters9@gmail.com למרות `.env` תקין.

## ✨ מה הוספנו?

### 1. אימות SMTP בעת עליית השרת
השרת עכשיו בודק אוטומטית את חיבור ה-SMTP בעת עלייה ומדפיס לוגים ברורים:
- ✅ אם החיבור תקין - תראה `✅ SMTP verify OK` עם פרטי ההגדרה
- ❌ אם יש בעיה - תראה `❌ SMTP verify FAILED` עם הסיבה המדויקת

### 2. מעקב מלא אחרי כל ניסיון שליחה
כל מייל שנשלח (או שנכשל) נרשם בטבלת `email_logs` עם:
- כתובת הנמען
- נושא המייל
- סטטוס (SENT / ERROR)
- הודעת שגיאה (אם יש)
- message_id (אם נשלח בהצלחה)
- זמן השליחה

### 3. אזהרות על הגדרות חסרות
אם `ADMIN_EMAILS` ריק בהגדרות `.env`, תראה אזהרה ברורה:
```
⚠️ ADMIN_EMAILS is empty – no admin mails will be sent
```

### 4. ראוטים חדשים לבדיקה מהירה (Admin בלבד)

#### א. בדיקת חיבור SMTP
```http
GET https://k-rstudio.com/api/admin/smtp/verify
```
**תגובה אם תקין:**
```json
{
  "ok": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "from": "fcmasters9@gmail.com",
  "user": "fcmasters9@gmail.com"
}
```

#### ב. שליחת מייל טסט
```http
POST https://k-rstudio.com/api/admin/smtp/test
Content-Type: application/json

{
  "to": "fcmasters9@gmail.com"
}
```
**תגובה:**
```json
{
  "ok": true,
  "messageId": "<abc123@gmail.com>"
}
```

#### ג. צפייה בלוגי מיילים (50 אחרונים)
```http
GET https://k-rstudio.com/api/admin/smtp/email-logs
```
**תגובה:**
```json
{
  "items": [
    {
      "id": 1,
      "to_email": "fcmasters9@gmail.com",
      "subject": "🆕 משתמש חדש נרשם",
      "status": "SENT",
      "error": null,
      "created_at": "2025-10-21 10:30:00"
    }
  ]
}
```

### 5. לוגים מפורטים בנקודות השליחה

#### הרשמת משתמש חדש
בעת הרשמה, תראה בלוגי השרת:
```
📧 ADMIN_EMAIL from ENV: fcmasters9@gmail.com
📧 Sending admin approval request to: fcmasters9@gmail.com
✅ Admin approval request sent successfully
📧 Sending admin notification to: fcmasters9@gmail.com
✅ Admin notification sent successfully
```

#### הצטרפות לטורניר
בעת הצטרפות, תראה:
```
📧 ADMIN notify: user joined tournament -> user@example.com T: tournament-123
📧 Sending to 1 admin(s): נרשם חדש לטורניר
✅ Tournament registration email sent successfully
```

---

## 📋 צ'קליסט בדיקה מהירה

### שלב 1: וידוא `.env` תקין

וודא שיש לך את כל המשתנים הבאים ב-`.env`:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fcmasters9@gmail.com
SMTP_PASS=your_app_password_here  # App Password (16 תווים)

# Email Settings
EMAIL_FROM=fcmasters9@gmail.com
ADMIN_EMAIL=fcmasters9@gmail.com
# או אם יש כמה מנהלים:
# ADMIN_EMAILS=fcmasters9@gmail.com,admin2@example.com

# Site URL (for email links)
SITE_URL=https://your-domain.com
```

### שלב 2: בדיקת חיבור יציאה מהשרת (SSH)

התחבר לשרת ובדוק אם פורט 587 פתוח:

```bash
# בדיקת יציאה ל-587 עם STARTTLS
openssl s_client -starttls smtp -crlf -connect smtp.gmail.com:587 -quiet <<< "QUIT"
```

**צפוי:** תראה חיבור מוצלח ואז `250 OK` או `221 Bye`

**אם נכשל:** הפורט חסום אצל הספק - צור קשר עם התמיכה של הספק.

### שלב 3: הפעל את השרת ובדוק את הלוגים

```bash
npm run build
npm start
```

חפש בלוגים את:
```
✅ SMTP verify OK { host: 'smtp.gmail.com', port: 587, ... }
```

**אם תראה `❌ SMTP verify FAILED`:**
- בדוק שה-App Password נכון (16 תווים, ללא רווחים)
- וודא ש-2FA מופעל בחשבון Gmail
- בדוק שאין "Blocked sign-in attempt" ב-Google Account Security

### שלב 4: בדוק דרך הדפדפן (כמנהל)

א. אימות חיבור:
```
https://your-domain.com/api/admin/smtp/verify
```

ב. שלח מייל טסט:
```bash
curl -X POST https://your-domain.com/api/admin/smtp/test \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{"to":"fcmasters9@gmail.com"}'
```

ג. בדוק לוגי מיילים:
```
https://your-domain.com/api/admin/smtp/email-logs
```

### שלב 5: בדיקת פעילות אמיתית

א. **הרשמת משתמש חדש:**
1. הרשם כמשתמש חדש
2. בדוק בלוגי השרת שתראה:
   ```
   📧 ADMIN_EMAIL from ENV: fcmasters9@gmail.com
   📧 Sending admin approval request
   ✅ Admin approval request sent successfully
   ```
3. בדוק ב-`/api/admin/smtp/email-logs` שנרשם `SENT`
4. בדוק בתיבת המייל (כולל SPAM)

ב. **הצטרפות לטורניר:**
1. הצטרף לטורניר קיים
2. בדוק בלוגי השרת את:
   ```
   📧 ADMIN notify: user joined tournament
   ✅ Tournament registration email sent successfully
   ```

---

## 🔧 פתרון בעיות נפוצות

### בעיה: "SMTP verify FAILED" - Authentication failed

**פתרון:**
1. וודא שאתה משתמש ב-**App Password** (לא הסיסמה הרגילה)
2. צור App Password חדש:
   - כנס ל-Google Account → Security → 2-Step Verification → App passwords
   - צור סיסמה חדשה לאפליקציה
   - העתק את ה-16 תווים (ללא רווחים) ל-`SMTP_PASS`
3. הפעל מחדש את השרת

### בעיה: "Connection timeout" או "ECONNREFUSED"

**פתרון:**
1. פורט 587 חסום על ידי הספק
2. נסה את פורט 465 עם SSL:
   ```
   SMTP_PORT=465
   SMTP_SECURE=true
   ```
3. או צור קשר עם התמיכה של הספק לפתיחת פורט 587

### בעיה: המייל נשלח (status=SENT) אבל לא מגיע

**פתרון:**
1. בדוק בתיבת **SPAM/Promotions**
2. כנס ל-Google Account → Security → Recent security activity
3. אם יש "Blocked sign-in attempt", לחץ "Yes, it was me"
4. בדוק **Quota Limit** - גוגל מגביל 500 מיילים ביום
5. וודא ש-`FROM` זהה ל-`SMTP_USER` (fcmasters9@gmail.com)

### בעיה: "ADMIN_EMAILS is empty" - לא נשלחים מיילים למנהל

**פתרון:**
1. וודא שיש `ADMIN_EMAIL` או `ADMIN_EMAILS` ב-`.env`
2. אם יש כמה מנהלים, הפרד בפסיקים:
   ```
   ADMIN_EMAILS=fcmasters9@gmail.com,admin2@example.com
   ```
3. הפעל מחדש את השרת

### בעיה: לוגים לא מופיעים ב-`email_logs`

**פתרון:**
1. הטבלה נוצרת אוטומטית בפעם הראשונה
2. וודא שיש הרשאות כתיבה למסד הנתונים
3. בדוק את הלוגים אם יש שגיאת `email_logs insert failed`

---

## 📊 בדיקת סטטוס נוכחי

### 1. בדיקה מהירה מהדפדפן

פתח את הכלים למפתחים (F12) והריץ:

```javascript
// בדיקת SMTP
fetch('/api/admin/smtp/verify', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);

// שליחת טסט
fetch('/api/admin/smtp/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ to: 'fcmasters9@gmail.com' })
})
  .then(r => r.json())
  .then(console.log);

// צפייה בלוגים
fetch('/api/admin/smtp/email-logs', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);
```

### 2. בדיקה מ-SSH (לוגי שרת)

```bash
# הצגת לוגי השרת (אם משתמש ב-PM2)
pm2 logs fc-masters-cup --lines 100

# או אם משתמש ב-systemd
journalctl -u fc-masters-cup -n 100 -f

# חיפוש אחרי לוגי SMTP
pm2 logs fc-masters-cup --lines 1000 | grep -E "(SMTP|📧|✅|❌)"
```

---

## 🎓 דוגמאות שימוש

### דוגמה 1: בדיקת חיבור SMTP עם curl

```bash
curl -X GET https://k-rstudio.com/api/admin/smtp/verify \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

### דוגמה 2: שליחת מייל טסט למנהל

```bash
curl -X POST https://k-rstudio.com/api/admin/smtp/test \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"fcmasters9@gmail.com"}'
```

### דוגמה 3: צפייה בלוגי מיילים אחרונים

```bash
curl -X GET https://k-rstudio.com/api/admin/smtp/email-logs \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ✅ סיכום השינויים

### קבצים שעודכנו:

1. **`server/src/modules/mail/mailer.ts`**
   - הוספת `parseAdminEmails()` לפרסור כתובות מנהלים
   - שדרוג `verifySmtp()` עם לוגים מפורטים
   - הוספת `logEmail()` לרישום כל שליחה ב-DB
   - הוספת `sendToAdmins()` לשליחה לכל המנהלים
   - הוספת תבניות `tplNewUserRegistered()` ו-`tplUserJoinedTournament()`

2. **`server/src/modules/admin/smtp.routes.ts`**
   - הוספת endpoint `/verify` - בדיקת חיבור SMTP
   - הוספת endpoint `/test` - שליחת מייל טסט
   - הוספת endpoint `/email-logs` - צפייה בלוגי מיילים

3. **`server/src/index.ts`**
   - הוספת אימות SMTP אוטומטי בעת עליית השרת

4. **`server/src/routes/auth.ts`**
   - הוספת לוגים מפורטים בהרשמת משתמש חדש
   - הוספת try-catch עם לוגים לכל שליחת מייל

5. **`server/src/routes/tournamentRegistrations.ts`**
   - הוספת לוגים מפורטים בהצטרפות לטורניר
   - שיפור טיפול בשגיאות שליחת מייל

---

## 🚀 צעדים הבאים

1. **Deploy לשרת:**
   ```bash
   npm run build
   pm2 restart fc-masters-cup
   ```

2. **בדוק לוגים מיד אחרי העלאה:**
   ```bash
   pm2 logs fc-masters-cup --lines 50
   ```
   
   חפש את: `✅ SMTP verify OK`

3. **בצע בדיקת טסט:**
   - כנס לדפדפן כמנהל
   - גש ל-`/api/admin/smtp/verify`
   - שלח מייל טסט דרך `/api/admin/smtp/test`

4. **בצע בדיקה מלאה:**
   - הרשם כמשתמש חדש
   - הצטרף לטורניר קיים
   - בדוק שהמיילים הגיעו ל-fcmasters9@gmail.com

---

## 📞 תמיכה

אם עדיין יש בעיות אחרי כל הצעדים:

1. **אסוף מידע:**
   - לוגי השרת (50 שורות אחרונות)
   - תוצאת `/api/admin/smtp/verify`
   - תוצאת `/api/admin/smtp/email-logs`
   - בדיקת openssl s_client

2. **בדוק בגוגל:**
   - Google Account → Security → Recent activity
   - חפש "Blocked sign-in attempt"
   - בדוק שה-2FA פעיל

3. **בדוק בתיבת המייל:**
   - Spam/Promotions
   - Filters (שהמיילים לא מסוננים אוטומטית)

---

**עדכון אחרון:** 21 אוקטובר 2025

