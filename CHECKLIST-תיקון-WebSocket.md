# ✅ Checklist - תיקון WebSocket על k-rstudio.com

## 📋 לפני שמתחילים

- [ ] יש לי גישת SSH לשרת (root או sudo)
- [ ] אני יודע את כתובת השרת: `k-rstudio.com`
- [ ] הורדתי את כל הקבצים מהפרויקט
- [ ] אני בתיקייה הנכונה של הפרויקט

---

## 🔧 תהליך התיקון

### שלב 1: הכנה
- [ ] פתחתי PowerShell/Terminal בתיקיית הפרויקט
- [ ] בדקתי שהקובץ `nginx-config-k-rstudio-ssl.txt` קיים
- [ ] בדקתי שהסקריפט `update-nginx-ssl.ps1` או `update-nginx-ssl.sh` קיים

### שלב 2: הרצת סקריפט
- [ ] הפעלתי את הסקריפט:
  - Windows: `.\update-nginx-ssl.ps1`
  - Linux/macOS: `./update-nginx-ssl.sh`
- [ ] הכנסתי שם משתמש SSH
- [ ] הכנסתי כתובת שרת
- [ ] אישרתי המשך (Y)

### שלב 3: טיפול בשגיאות (אם יש)

#### אם יש שגיאת SSL Certificate:
- [ ] התחברתי לשרת: `ssh root@k-rstudio.com`
- [ ] הפעלתי: `sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com`
- [ ] עניתי על שאלות Certbot:
  - [ ] Email: _________________
  - [ ] Terms: Yes
  - [ ] Redirect: Yes
- [ ] הפעלתי שוב את הסקריפט

#### אם יש שגיאת Connection:
- [ ] בדקתי חיבור SSH: `ssh root@k-rstudio.com`
- [ ] בדקתי שה־Firewall לא חוסם
- [ ] ניסיתי שוב

### שלב 4: אימות הצלחה
- [ ] הסקריפט הצליח ללא שגיאות
- [ ] קיבלתי הודעה: "🎉 התצורה עודכנה בהצלחה!"

---

## 🧪 בדיקות

### בדיקה 1: סקריפט אוטומטי
- [ ] הפעלתי: `.\test-websocket-ssl.ps1`
- [ ] כל הבדיקות עברו (✅):
  - [ ] HTTPS עובד
  - [ ] SSL Certificate תקין
  - [ ] API Endpoint עובד
  - [ ] WebSocket Endpoint זמין

### בדיקה 2: דפדפן
- [ ] פתחתי: `https://www.k-rstudio.com`
- [ ] פתחתי Console (F12)
- [ ] ראיתי את ההודעות:
  - [ ] `🔌 Connecting to WebSocket: wss://www.k-rstudio.com/presence`
  - [ ] `✅ WebSocket connected successfully`
  - [ ] `👋 Presence hello: X users`

### בדיקה 3: בדיקה ויזואלית (אופציונלי)
- [ ] פתחתי את `test-websocket-connection.html` בדפדפן
- [ ] הכנסתי URL: `wss://www.k-rstudio.com/presence`
- [ ] לחצתי "התחבר"
- [ ] ראיתי: "✅ WebSocket התחבר בהצלחה!"

---

## 🔍 בדיקת שרת

### בדיקה בשרת עצמו
- [ ] התחברתי לשרת: `ssh root@k-rstudio.com`
- [ ] בדקתי Nginx: `sudo systemctl status nginx`
  - [ ] סטטוס: `active (running)` ✅
- [ ] בדקתי PM2: `pm2 status`
  - [ ] השרת `fc-masters` רץ ✅
  - [ ] סטטוס: `online` ✅
- [ ] בדקתי לוגים: `pm2 logs fc-masters --lines 20`
  - [ ] אין שגיאות ✅
  - [ ] רואה: "✅ Server started successfully"

### בדיקת CORS
- [ ] בדקתי `.env` בשרת: `cat /var/www/fcmasters/server/.env | grep CORS`
- [ ] ראיתי: `CORS_ORIGIN=https://www.k-rstudio.com` ✅
- [ ] אם לא נכון - תיקנתי:
  - [ ] `nano /var/www/fcmasters/server/.env`
  - [ ] עדכנתי את `CORS_ORIGIN`
  - [ ] הפעלתי מחדש: `pm2 restart fc-masters`

---

## ❌ פתרון בעיות

### אם WebSocket לא מתחבר (1006)

#### בדיקה 1: שרת Node.js
- [ ] `pm2 status` - האם השרת רץ?
  - אם לא: `pm2 restart fc-masters`
- [ ] `pm2 logs fc-masters --lines 50` - יש שגיאות?

#### בדיקה 2: Nginx
- [ ] `sudo nginx -t` - האם התצורה תקינה?
  - אם לא: בדוק שגיאות ותקן
- [ ] `sudo tail -f /var/log/nginx/error.log` - יש שגיאות?

#### בדיקה 3: SSL
- [ ] `sudo ls -la /etc/letsencrypt/live/k-rstudio.com/` - האם קיים?
  - אם לא: `sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com`

#### בדיקה 4: Port
- [ ] `sudo netstat -tlnp | grep 8787` - האם השרת מאזין?
  - אם לא: השרת לא רץ, הפעל עם `pm2 start`

### אם יש שגיאת Authentication (4401)
- [ ] זה **תקין** אם אתה לא מחובר לאתר
- [ ] WebSocket דורש Cookie של session
- [ ] פתרון:
  1. [ ] התחבר לאתר בטאב אחד
  2. [ ] פתח Console בטאב אחר באותו דומיין
  3. [ ] בדוק את החיבור

### אם יש שגיאת CORS
- [ ] בדוק `.env`: `CORS_ORIGIN=https://www.k-rstudio.com`
- [ ] הפעל מחדש: `pm2 restart fc-masters`

---

## 📊 Check List סופי

### תצורה
- [ ] SSL Certificate מותקן
- [ ] Nginx מוגדר עם HTTPS (port 443)
- [ ] Nginx מוגדר עם WebSocket headers
- [ ] השרת Node.js רץ (pm2 status)
- [ ] CORS_ORIGIN נכון ב־`.env`

### תוצאות
- [ ] הדפדפן מציג "✅ WebSocket connected successfully"
- [ ] אין שגיאות בConsole (F12)
- [ ] מערכת הנוכחות (Presence) עובדת
- [ ] משתמשים רואים מי מחובר בזמן אמת

### גיבויים
- [ ] יש לי גיבוי של התצורה הישנה:
  - נתיב: `/etc/nginx/sites-available/fcmasters.backup-*`
- [ ] אני יודע איך לשחזר אם צריך:
  - `sudo cp /etc/nginx/sites-available/fcmasters.backup-* /etc/nginx/sites-available/fcmasters`
  - `sudo systemctl reload nginx`

---

## 🎉 סיום

אם כל הסעיפים מסומנים ✅ - **מזל טוב!** התיקון הושלם בהצלחה! 🎊

### מה הבא?
- [ ] שמרתי את הקבצים האלה למקרה שאצטרך אותם שוב
- [ ] תיעדתי את השינויים (אופציונלי)
- [ ] עדכנתי צוות (אם רלוונטי)

---

## 📚 מסמכים נוספים

אם יש בעיות או שאלות:
- **מהיר:** `תיקון-מהיר-WebSocket.md`
- **מפורט:** `תיקון-WebSocket-SSL.md`
- **README:** `README-תיקון-WebSocket.md`
- **סיכום:** `סיכום-קבצי-תיקון-WebSocket.md`

---

**תאריך תיקון:** ___/___/2025  
**בוצע על ידי:** _________________  
**תוצאה:** ✅ הצלחה / ❌ נדרש המשך

---

**הערות נוספות:**
_________________________________________________
_________________________________________________
_________________________________________________

