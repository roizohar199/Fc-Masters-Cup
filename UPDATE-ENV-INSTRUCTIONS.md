# עדכון .env - הוראות

## מה צריך לעשות

הוסף את השורה הזו לקובץ `.env` (בשורש הפרויקט):

```bash
EMAIL_FROM="FC Masters Cup <fcmasters9@gmail.com>"
```

## איפה?

1. פתח את הקובץ: `C:\FC Masters Cup\.env`
2. הוסף את השורה בסוף הקובץ (או אחרי `SMTP_PASS`)
3. שמור

## לאחר מכן

```powershell
cd server
npm run build
npm start
```

## בדיקה

```powershell
# בדוק שה-ENV נטען:
node compare-smtp-config.mjs

# בדוק forgot-password:
node test-forgot-password-manual.mjs fcmasters9@gmail.com
```

## הקובץ .env המלא צריך להכיל

```bash
# ...הגדרות קיימות...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fcmasters9@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="FC Masters Cup <fcmasters9@gmail.com>"  ← הוסף את זה!
```

---

## סיכום השינויים שביצעתי

### ✅ תיקנתי את `server/src/email.ts`:

**לפני**:
```typescript
secure: process.env.SMTP_PORT === '465'  // logic מסובך
requireTLS: process.env.SMTP_REQUIRE_TLS === 'true'
```

**אחרי** (זהה ל-test-send.js):
```typescript
const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
secure: smtpSecure  // פשוט וברור!
```

### ✅ הוספתי לוגים:
כשהשרת עולה, תראה:
```
[email] 📧 Creating SMTP transporter with config:
  Host: smtp.gmail.com
  Port: 587
  Secure: false
  User: fcmasters9@gmail.com
  Pass: ***lcnr
```

### ✅ יצרתי כלי עזר:

1. **`server/compare-smtp-config.mjs`** - השוואת תצורה
2. **`server/README-SMTP.md`** - מדריך מלא לSMTP
3. **`UPDATE-ENV-INSTRUCTIONS.md`** - הוראות עדכון .env

---

## התוצאה

עכשיו `/auth/forgot-password` משתמש **בדיוק באותה תצורת SMTP** כמו `test-send.js`! 🎉

המיילים יישלחו מ-`fcmasters9@gmail.com` (או מה-EMAIL_FROM אם תוסיף).

