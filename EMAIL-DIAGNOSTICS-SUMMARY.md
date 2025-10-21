# סיכום מהיר - מערכת אבחון מיילים

## ✅ מה עשינו?

הוספנו **מערכת אבחון מלאה** למיילים שלא מגיעים ל-`fcmasters9@gmail.com`.

---

## 🚀 התחלה מהירה

### 1. וודא שה-`.env` מעודכן:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fcmasters9@gmail.com
SMTP_PASS=your-app-password-16-chars
EMAIL_FROM=fcmasters9@gmail.com
ADMIN_EMAILS=fcmasters9@gmail.com
```

### 2. הרץ בדיקה מקומית:

```bash
npm run test:email
```

### 3. העלה לשרת:

```bash
npm run build
# העלה ל-VPS
pm2 restart fc-masters-cup
pm2 logs fc-masters-cup --lines 50
```

חפש בלוגים: `✅ SMTP verify OK`

### 4. בדוק דרך הדפדפן (כמנהל):

```
https://k-rstudio.com/api/admin/smtp/verify
https://k-rstudio.com/api/admin/smtp/email-logs
```

---

## 📋 קבצים שנוצרו/עודכנו

| קובץ | מה השתנה |
|------|---------|
| `server/src/modules/mail/mailer.ts` | הוספת אימות SMTP, לוג DB, `sendToAdmins()` |
| `server/src/modules/admin/smtp.routes.ts` | endpoints חדשים: `/verify`, `/test`, `/email-logs` |
| `server/src/index.ts` | אימות SMTP בעת עלייה |
| `server/src/routes/auth.ts` | לוגים מפורטים בהרשמה |
| `server/src/routes/tournamentRegistrations.ts` | לוגים מפורטים בהצטרפות לטורניר |
| `env.example` | הוספת `ADMIN_EMAILS` + הערות מפורטות |
| `test-email-system.mjs` | סקריפט בדיקה מהיר |
| `EMAIL-DIAGNOSTICS-GUIDE.md` | מדריך מפורט (קרא את זה!) |

---

## 🔍 בדיקות מהירות

### א. לוגי השרת
```bash
pm2 logs fc-masters-cup --lines 100 | grep -E "(SMTP|📧|✅|❌)"
```

### ב. בדיקת SMTP מהדפדפן
```javascript
// פתח Console (F12) באתר https://k-rstudio.com
fetch('/api/admin/smtp/verify', {credentials:'include'})
  .then(r => r.json())
  .then(console.log);
```

### ג. שליחת טסט
```javascript
fetch('/api/admin/smtp/test', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'include',
  body: JSON.stringify({to: 'fcmasters9@gmail.com'})
}).then(r => r.json()).then(console.log);
```

### ד. צפייה בלוגי מיילים
```javascript
fetch('/api/admin/smtp/email-logs', {credentials:'include'})
  .then(r => r.json())
  .then(console.log);
```

---

## ⚠️ פתרון בעיות נפוצות

### "SMTP verify FAILED" - Authentication
**פתרון:** צור App Password חדש ב-[Google Account](https://myaccount.google.com/apppasswords)

### "Connection timeout"
**פתרון:** פורט 587 חסום - נסה:
```bash
SMTP_PORT=465
SMTP_SECURE=true
```

### מייל נשלח אבל לא מגיע
**פתרון:** 
1. בדוק SPAM/Promotions
2. Google Account → Security → Recent activity
3. אשר "Blocked sign-in attempt" אם יש

### "ADMIN_EMAILS is empty"
**פתרון:** הוסף ל-`.env`:
```bash
ADMIN_EMAILS=fcmasters9@gmail.com
```

---

## 📚 מסמכים נוספים

- **`EMAIL-DIAGNOSTICS-GUIDE.md`** - מדריך מפורט עם כל האפשרויות
- **`env.example`** - דוגמה מעודכנת לקובץ `.env`
- **`test-email-system.mjs`** - סקריפט בדיקה אוטומטי

---

## 🎯 מה הלאה?

1. ✅ הרץ `npm run test:email` מקומית
2. ✅ תקן שגיאות אם יש
3. ✅ העלה לשרת
4. ✅ בדוק לוגים: `pm2 logs`
5. ✅ בצע הרשמה/הצטרפות לטורניר
6. ✅ וודא שהמיילים מגיעים

---

**נוצר ב-21 אוקטובר 2025**

