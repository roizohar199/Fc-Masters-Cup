# איך לבדוק את הלוגים של השרת

## הבעיה
הבקשה ל-`/api/auth/forgot-password` עברה בהצלחה (200 OK), אבל המייל לא מגיע.

## מה לבדוק

### 1. בדוק את לוגי השרת
אם השרת רץ בחלון נפרד, תחפש בו:

```
🔑 FORGOT PASSWORD REQUEST START
✅ Validation OK - Email: roizohar111@gmail.com
👤 User FOUND - Status: active
🎫 Creating password reset token...
✅ Token created successfully
📧 Sending password reset email...
```

אם תראה:
- ✅ `Email sent successfully!` - המייל נשלח (בדוק Spam)
- ❌ `Email sending FAILED` - יש בעיה בSMTP

### 2. בדוק את תצורת SMTP בשרת
כשהשרת עולה, צריך לראות:

```
[email] 📧 Creating SMTP transporter with config:
  Host: smtp.gmail.com
  Port: 587
  Secure: false
  User: roizohar111@gmail.com
  Pass: ***lcnr
```

### 3. אם לא רואה את הלוגים
השרת אולי לא רץ עם הקוד החדש. עצור והפעל מחדש:

```powershell
# עצור את כל Node.js processes:
Get-Process -Name "node" | Stop-Process -Force

# הרץ מחדש:
cd server
npm run build
npm start
```

### 4. בדיקה נוספת
הרץ ב-2 חלונות:

**חלון 1 - השרת:**
```powershell
cd server
npm start
# שמור את החלון פתוח ותסתכל על הלוגים
```

**חלון 2 - הבדיקה:**
```powershell
node test-forgot-debug.mjs roizohar111@gmail.com
# עכשיו תחזור לחלון 1 ותראה את הלוגים
```

## אפשרויות למה המייל לא מגיע

### אפשרות 1: המייל נשלח אבל בSpam
- בדוק תיקיית Spam/Junk
- בדוק Promotions (Gmail)
- בדוק Updates (Gmail)

### אפשרות 2: SMTP לא מוגדר נכון
הרץ:
```bash
cd server
node compare-smtp-config.mjs
```

צריך לראות:
```
✅ SMTP is configured
✅ Ready to send emails!
```

### אפשרות 3: הקוד לא שולח בכלל
בדוק בלוגי השרת אם רואה:
```
⚠️ User NOT FOUND in database
```
או
```
⚠️ User exists but status is: pending
```

### אפשרות 4: שגיאת SMTP
בדוק בלוגים:
```
❌ Email sending FAILED: ...
```

אם רואה שגיאה, הרץ:
```bash
cd server
node test-send.js
```

אם `test-send.js` עובד אבל forgot-password לא - צריך לבדוק את הקוד.

