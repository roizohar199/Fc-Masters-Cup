<div dir="rtl" style="text-align: right;">

# 🚀 מדריך מפורט להעלאת האתר ל-Hostinger VPS

**תאריך:** 17 אוקטובר 2025  
**זמן משוער:** 60-90 דקות

---

## 📋 תוכן עניינים

1. [רכישת VPS והכנה](#שלב-1-רכישת-vps-והכנה)
2. [התחברות לשרת](#שלב-2-התחברות-לשרת)
3. [הכנת השרת](#שלב-3-הכנת-השרת)
4. [התקנת תוכנות](#שלב-4-התקנת-תוכנות)
5. [העלאת הקוד](#שלב-5-העלאת-הקוד)
6. [הגדרת Nginx](#שלב-6-הגדרת-nginx)
7. [הגדרת SSL](#שלב-7-הגדרת-ssl)
8. [הפעלת האתר](#שלב-8-הפעלת-האתר)
9. [בדיקות](#שלב-9-בדיקות)
10. [גיבויים וניטור](#שלב-10-גיבויים-וניטור)

---

## 🎯 מה תצטרך לפני שמתחילים:

- [ ] חשבון ב-Hostinger
- [ ] כרטיס אשראי לתשלום ($7/חודש)
- [ ] דומיין (או subdomain)
- [ ] התקנת PuTTY (ל-SSH מ-Windows) - [הורד כאן](https://www.putty.org/)
- [ ] התקנת WinSCP (להעלאת קבצים) - [הורד כאן](https://winscp.net/)

---

# שלב 1: רכישת VPS והכנה

## 1.1 רכישת VPS מ-Hostinger

### א. היכנס לאתר Hostinger
1. גש ל: https://www.hostinger.com/vps-hosting
2. התחבר לחשבון שלך (או צור חשבון חדש)

### ב. בחר את החבילה
1. לחץ על **"VPS Hosting"**
2. בחר **"KVM 1"** (4GB RAM, 2 CPU cores) - **$7/חודש**
3. לחץ **"Add to Cart"**

### ג. בחר מערכת הפעלה
1. במסך הבא, בחר: **"Ubuntu 22.04 LTS (64-bit)"**
2. **חשוב:** רשום את **IP Address** שתקבל
3. לחץ **"Continue"**

### ד. השלם רכישה
1. מלא פרטי תשלום
2. לחץ **"Submit Secure Payment"**
3. המתן 2-5 דקות עד שה-VPS מוכן

---

## 1.2 קבלת פרטי גישה

אחרי הרכישה, תקבל מייל עם:
```
VPS IP: 123.456.789.123
SSH Port: 22
Username: root
Password: [סיסמה זמנית]
```

**⚠️ חשוב:** שמור את הפרטים האלה במקום בטוח!

---

# שלב 2: התחברות לשרת

## 2.1 התקנת PuTTY (אם עוד לא)

1. הורד PuTTY מ: https://www.putty.org/
2. התקן את התוכנה
3. פתח את PuTTY

## 2.2 התחברות ראשונית

### א. פתח PuTTY
1. **Host Name:** הכנס את ה-IP שקיבלת (למשל: `123.456.789.123`)
2. **Port:** `22`
3. **Connection type:** `SSH`
4. לחץ **"Open"**

### ב. קבל את התעודה
תקבל אזהרה:
```
The server's host key is not cached...
```
לחץ **"Yes"**

### ג. התחבר
```
login as: root
password: [הכנס את הסיסמה מהמייל]
```

**שים לב:** הסיסמה לא תופיע בזמן ההקלדה - זה נורמלי!

### ד. שנה סיסמה (חובה!)
```bash
passwd
```
הכנס סיסמה חדשה וחזקה פעמיים.

**אתה בפנים!** 🎉

---

# שלב 3: הכנת השרת

## 3.1 עדכון המערכת

העתק והדבק את הפקודה הזו:
```bash
apt update && apt upgrade -y
```
זה ייקח 2-5 דקות.

## 3.2 יצירת משתמש חדש (אופציונלי אבל מומלץ)

במקום לעבוד כ-root, צור משתמש חדש:
```bash
# צור משתמש
adduser fcmaster

# הוסף לקבוצת sudo
usermod -aG sudo fcmaster

# עבור למשתמש החדש
su - fcmaster
```

מעכשיו תעבוד עם המשתמש `fcmaster` (או השם שבחרת).

---

# שלב 4: התקנת תוכנות

## 4.1 התקנת Node.js 20

```bash
# הוסף את מאגר Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# התקן Node.js
sudo apt-get install -y nodejs

# בדוק התקנה
node --version
# צריך להציג: v20.x.x

npm --version
# צריך להציג: 10.x.x
```

## 4.2 התקנת PM2 (Process Manager)

PM2 ידאג שהאתר ירוץ כל הזמן:
```bash
sudo npm install -g pm2

# בדוק התקנה
pm2 --version
```

## 4.3 התקנת Nginx (Web Server)

Nginx ישמש כ-reverse proxy:
```bash
sudo apt install nginx -y

# הפעל Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# בדוק סטטוס
sudo systemctl status nginx
# צריך להציג: active (running)
```

## 4.4 התקנת Certbot (SSL)

לאישורי SSL חינמיים:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 4.5 התקנת Git (אופציונלי)

אם תרצה לעדכן דרך Git:
```bash
sudo apt install git -y
```

---

# שלב 5: העלאת הקוד

## 5.1 הכנת הקוד במחשב שלך (Windows)

### א. בנה את הפרויקט
פתח PowerShell בתיקיית הפרויקט:
```powershell
# בנה את הפרויקט
npm run build

# בדוק שהכל תקין
dir server\dist
dir client\dist
```

### ב. תקן את קובץ .env

**חשוב מאוד!** תקן את ה-.env:
```env
PORT=8787
NODE_ENV=production

# שנה את ה-URLs לדומיין שלך:
SITE_URL=https://fcmasters.yourdomain.com
CORS_ORIGIN=https://fcmasters.yourdomain.com

# שאר ההגדרות נשארות אותו דבר:
ADMIN_EMAIL=fcmasters9@gmail.com
ADMIN_PASSWORD=Roizohar1985
JWT_SECRET=2670b72afa9d87ecbbb65bdb4959f67b129894eb9de7135295665148852f9b990181540461fc3e88c95b16e8a0ad1e20004203e1b9778e66a683fd5a39369a07

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fcmasters9@gmail.com
SMTP_PASS=acccxggzncimlcnr
SMTP_FROM=FC Masters Cup <fcmasters9@gmail.com>
SMTP_SECURE=false
```

**⚠️ חשוב:** החלף `fcmasters.yourdomain.com` בדומיין האמיתי שלך!

## 5.2 יצירת תיקיות בשרת

בחזרה ל-PuTTY (השרת):
```bash
# צור תיקייה לאתר
sudo mkdir -p /var/www/fcmasters
sudo chown -R $USER:$USER /var/www/fcmasters
cd /var/www/fcmasters
```

## 5.3 העלאת קבצים עם WinSCP

### א. פתח WinSCP
1. **File protocol:** SFTP
2. **Host name:** ה-IP שלך
3. **Port number:** 22
4. **User name:** `fcmaster` (או `root`)
5. **Password:** הסיסמה שלך
6. לחץ **"Login"**

### ב. העלה קבצים
בצד ימין (השרת), נווט ל: `/var/www/fcmasters`

בצד שמאל (המחשב שלך), נווט לתיקיית הפרויקט.

**העלה את הקבצים/תיקיות הבאים:**
- [ ] `server/dist/` → `/var/www/fcmasters/server/dist/`
- [ ] `server/node_modules/` → `/var/www/fcmasters/server/node_modules/`
- [ ] `server/package.json` → `/var/www/fcmasters/server/`
- [ ] `server/package-lock.json` → `/var/www/fcmasters/server/`
- [ ] `server/tournaments.sqlite` → `/var/www/fcmasters/server/`
- [ ] `client/dist/` → `/var/www/fcmasters/client/dist/`
- [ ] `.env` → `/var/www/fcmasters/`

**זה ייקח 5-10 דקות** (תלוי במהירות האינטרנט)

## 5.4 התקנת dependencies בשרת

חזור ל-PuTTY:
```bash
cd /var/www/fcmasters/server
npm install --production
```

זה ייקח 2-3 דקות.

---

# שלב 6: הגדרת Nginx

## 6.1 יצירת קובץ הגדרות

```bash
sudo nano /etc/nginx/sites-available/fcmasters
```

העתק והדבק את התוכן הזה:
```nginx
server {
    listen 80;
    server_name fcmasters.yourdomain.com www.fcmasters.yourdomain.com;

    # Client (React)
    location / {
        root /var/www/fcmasters/client/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # API
    location /api {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Presence)
    location /presence {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Uploads
    location /uploads {
        alias /var/www/fcmasters/server/src/uploads;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

**⚠️ חשוב:** החלף `fcmasters.yourdomain.com` בדומיין שלך!

שמור וצא:
- לחץ `Ctrl + O` (שמור)
- Enter
- לחץ `Ctrl + X` (צא)

## 6.2 הפעלת האתר

```bash
# צור קישור
sudo ln -s /etc/nginx/sites-available/fcmasters /etc/nginx/sites-enabled/

# מחק את ברירת המחדל
sudo rm /etc/nginx/sites-enabled/default

# בדוק תקינות
sudo nginx -t
# צריך להציג: syntax is ok

# אתחל Nginx
sudo systemctl reload nginx
```

---

# שלב 7: הגדרת SSL (HTTPS)

## 7.1 הכנה

ודא שהדומיין שלך מצביע לשרת:
```bash
ping fcmasters.yourdomain.com
```
אתה צריך לראות את ה-IP של השרת שלך.

**אם לא:** הגדר את ה-DNS בספק הדומיין:
- Type: `A`
- Name: `fcmasters` (או `@` לדומיין ראשי)
- Value: `123.456.789.123` (ה-IP שלך)
- TTL: 3600

המתן 5-10 דקות עד שה-DNS מתעדכן.

## 7.2 הפקת אישור SSL

```bash
sudo certbot --nginx -d fcmasters.yourdomain.com -d www.fcmasters.yourdomain.com
```

תשאלות:
1. **Email:** הכנס את המייל שלך
2. **Terms of Service:** `Y`
3. **Share email:** `N`
4. **Redirect HTTP to HTTPS:** `2` (Yes)

**סיימת! יש לך SSL!** 🔒

---

# שלב 8: הפעלת האתר

## 8.1 הפעלה עם PM2

```bash
cd /var/www/fcmasters

# טען את ה-.env
export $(cat .env | xargs)

# הפעל את השרת
pm2 start server/dist/index.js --name "fc-masters"

# שמור את ההגדרות
pm2 save

# הגדר אתחול אוטומטי
pm2 startup
# הרץ את הפקודה שPM2 יציג לך
```

## 8.2 בדוק שהשרת רץ

```bash
pm2 status
# צריך להציג: fc-masters | online

pm2 logs fc-masters
# צריך להציג את הלוגים של השרת
```

אם רואה:
```
✅ Server running on port 8787
📂 Database path: /var/www/fcmasters/server/tournaments.sqlite
```

**מעולה! השרת רץ!** 🎉

---

# שלב 9: בדיקות

## 9.1 בדוק שהאתר עובד

פתח דפדפן וגש ל:
```
https://fcmasters.yourdomain.com
```

אתה צריך לראות את האתר שלך! 🎉

## 9.2 בדוק התחברות

1. לחץ על **"התחבר"**
2. התחבר עם:
   - Email: `fcmasters9@gmail.com`
   - Password: `Roizohar1985`

אם זה עובד - **מעולה!** ✅

## 9.3 בדוק רישום משתמש חדש

1. נסה להירשם עם משתמש חדש
2. בדוק שהמייל מגיע
3. בדוק שהלינקים במייל עובדים

---

# שלב 10: גיבויים וניטור

## 10.1 הגדרת גיבוי אוטומטי

```bash
# צור תיקיית גיבויים
mkdir -p /var/www/fcmasters/backups

# פתח crontab
crontab -e
```

בחר עורך (לחץ `1` ל-nano)

הוסף בסוף הקובץ:
```bash
# גיבוי יומי בשעה 3 בלילה
0 3 * * * cd /var/www/fcmasters && cp server/tournaments.sqlite backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sqlite

# מחיקת גיבויים ישנים (30+ ימים)
0 4 * * * find /var/www/fcmasters/backups -name "backup-*.sqlite" -mtime +30 -delete
```

שמור וצא: `Ctrl + O`, Enter, `Ctrl + X`

## 10.2 הגדרת ניטור עם UptimeRobot

1. גש ל: https://uptimerobot.com
2. צור חשבון חינם
3. לחץ **"Add New Monitor"**
4. מלא:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** FC Masters Cup
   - **URL:** `https://fcmasters.yourdomain.com`
   - **Monitoring Interval:** 5 minutes
5. לחץ **"Create Monitor"**

תקבל התראות במייל אם האתר נופל! 📧

## 10.3 הגדרת Firewall

```bash
# התקן UFW
sudo apt install ufw -y

# אפשר SSH
sudo ufw allow 22/tcp

# אפשר HTTP
sudo ufw allow 80/tcp

# אפשר HTTPS
sudo ufw allow 443/tcp

# הפעל
sudo ufw enable

# בדוק סטטוס
sudo ufw status
```

---

# 🎉 סיימת! האתר באוויר!

## ✅ מה יש לך עכשיו:

- ✅ אתר רץ ב-HTTPS
- ✅ Node.js + PM2 רצים
- ✅ Nginx כ-reverse proxy
- ✅ SSL חינם (מתחדש אוטומטית)
- ✅ גיבוי אוטומטי יומי
- ✅ ניטור עם UptimeRobot
- ✅ Firewall פעיל

---

# 📋 פקודות שימושיות

## ניהול PM2

```bash
# ראה סטטוס
pm2 status

# ראה לוגים
pm2 logs fc-masters

# אתחל שרת
pm2 restart fc-masters

# עצור שרת
pm2 stop fc-masters

# מחק שרת
pm2 delete fc-masters
```

## ניהול Nginx

```bash
# בדוק תקינות
sudo nginx -t

# אתחל
sudo systemctl reload nginx

# הפעל מחדש
sudo systemctl restart nginx

# ראה לוגים
sudo tail -f /var/log/nginx/error.log
```

## בדיקת דיסק

```bash
# ראה שימוש בדיסק
df -h

# ראה קבצים גדולים
du -sh /var/www/fcmasters/*
```

---

# 🔄 איך לעדכן את האתר

כשיש עדכון:

```bash
# 1. בנה במחשב שלך
npm run build

# 2. העלה קבצים חדשים עם WinSCP
# server/dist/ -> /var/www/fcmasters/server/dist/
# client/dist/ -> /var/www/fcmasters/client/dist/

# 3. אתחל שרת בPuTTY
pm2 restart fc-masters

# סיימת!
```

---

# 🆘 פתרון בעיות

## האתר לא עובד

```bash
# בדוק שהשרת רץ
pm2 status

# אם לא - הפעל
pm2 start server/dist/index.js --name "fc-masters"

# ראה לוגים
pm2 logs fc-masters --lines 50
```

## בעיות SSL

```bash
# חדש אישור
sudo certbot renew --dry-run

# אם יש בעיה
sudo certbot delete
sudo certbot --nginx -d fcmasters.yourdomain.com
```

## בעיות Nginx

```bash
# בדוק תקינות
sudo nginx -t

# ראה שגיאות
sudo tail -f /var/log/nginx/error.log
```

## בעיות DB

```bash
# בדוק שהקובץ קיים
ls -lh /var/www/fcmasters/server/tournaments.sqlite

# בדוק הרשאות
sudo chown -R $USER:$USER /var/www/fcmasters
```

---

# 📞 צריך עזרה?

אם משהו לא עובד:
1. בדוק את הלוגים: `pm2 logs fc-masters`
2. בדוק Nginx: `sudo nginx -t`
3. בדוק שהדומיין מצביע נכון: `ping fcmasters.yourdomain.com`

**אני כאן לעזור!** 💪

---

# 🎯 סיכום זמנים

| שלב | זמן |
|-----|-----|
| רכישת VPS | 5 דקות |
| התחברות | 5 דקות |
| התקנת תוכנות | 10 דקות |
| העלאת קבצים | 10 דקות |
| הגדרת Nginx | 5 דקות |
| SSL | 5 דקות |
| בדיקות | 10 דקות |
| גיבויים | 5 דקות |
| **סה"כ** | **60 דקות** |

---

**בהצלחה! 🚀**

</div>

