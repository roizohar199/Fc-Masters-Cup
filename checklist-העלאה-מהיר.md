<div dir="rtl" style="text-align: right;">

# ✅ Checklist מהיר - העלאה ל-Hostinger

**הדפס את זה ושמור לצידך!**

---

## 🎯 לפני שמתחילים

- [ ] חשבון ב-Hostinger
- [ ] כרטיס אשראי
- [ ] דומיין מוכן
- [ ] PuTTY מותקן ([הורד](https://www.putty.org/))
- [ ] WinSCP מותקן ([הורד](https://winscp.net/))

---

## 📦 שלב 1: הכנה במחשב (10 דקות)

```powershell
# 1. בנה את הפרויקט
npm run build

# 2. ערוך .env - שנה:
SITE_URL=https://YOUR-DOMAIN.com
CORS_ORIGIN=https://YOUR-DOMAIN.com

# 3. בדוק שהכל תקין
- [ ] יש server\dist
- [ ] יש client\dist  
- [ ] יש server\tournaments.sqlite
```

---

## 🌐 שלב 2: קנה VPS (5 דקות)

1. [ ] לך ל-Hostinger → VPS
2. [ ] בחר **KVM 1** (4GB RAM) - $7/חודש
3. [ ] בחר **Ubuntu 22.04**
4. [ ] שלם
5. [ ] שמור את ה-IP, Username, Password מהמייל

---

## 🔌 שלב 3: התחבר (5 דקות)

### PuTTY:
```
Host: [ה-IP שלך]
Port: 22
Username: root
Password: [מהמייל]
```

### בשרת:
```bash
# שנה סיסמה
passwd

# עדכן מערכת
apt update && apt upgrade -y
```

---

## ⚙️ שלב 4: התקן תוכנות (10 דקות)

העתק והדבק:
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y

# צור תיקייה
sudo mkdir -p /var/www/fcmasters
sudo chown -R $USER:$USER /var/www/fcmasters
```

---

## 📤 שלב 5: העלה קבצים (10 דקות)

### WinSCP:
```
Host: [ה-IP]
Port: 22
Username: root
Password: [הסיסמה]
```

### העלה:
- [ ] `server/dist/` → `/var/www/fcmasters/server/dist/`
- [ ] `server/node_modules/` → `/var/www/fcmasters/server/node_modules/`
- [ ] `server/package.json` → `/var/www/fcmasters/server/`
- [ ] `server/tournaments.sqlite` → `/var/www/fcmasters/server/`
- [ ] `client/dist/` → `/var/www/fcmasters/client/dist/`
- [ ] `.env` → `/var/www/fcmasters/`

### בשרת:
```bash
cd /var/www/fcmasters/server
npm install --production

mkdir -p /var/www/fcmasters/server/src/uploads
```

---

## 🔧 שלב 6: הגדר Nginx (5 דקות)

```bash
sudo nano /etc/nginx/sites-available/fcmasters
```

**העתק את התוכן מקובץ:** `deploy-config-nginx.txt`

**החלף:** `fcmasters.yourdomain.com` → הדומיין שלך!

```bash
# הפעל
sudo ln -s /etc/nginx/sites-available/fcmasters /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 שלב 7: SSL (5 דקות)

```bash
# וודא DNS מצביע (חכה 5-10 דקות)
ping YOUR-DOMAIN.com

# הפק SSL
sudo certbot --nginx -d YOUR-DOMAIN.com -d www.YOUR-DOMAIN.com
# בחר: Email → Y → N → 2
```

---

## 🚀 שלב 8: הפעל את האתר (5 דקות)

```bash
cd /var/www/fcmasters
export $(cat .env | xargs)

pm2 start server/dist/index.js --name "fc-masters"
pm2 save
pm2 startup
# הרץ את הפקודה שPM2 מציג

# בדוק
pm2 status
pm2 logs fc-masters
```

---

## ✅ שלב 9: בדיקות (5 דקות)

1. [ ] פתח: `https://YOUR-DOMAIN.com`
2. [ ] האתר נטען? ✅
3. [ ] התחבר עם המשתמש שלך
4. [ ] זה עובד? ✅
5. [ ] נסה להירשם עם משתמש חדש
6. [ ] המייל הגיע? ✅
7. [ ] הלינק במייל עובד? ✅

---

## 🛡️ שלב 10: אבטחה (5 דקות)

```bash
# Firewall
sudo apt install ufw -y
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# גיבוי אוטומטי
crontab -e
# הוסף בסוף:
0 3 * * * cp /var/www/fcmasters/server/tournaments.sqlite /var/www/fcmasters/backups/backup-$(date +\%Y\%m\%d).sqlite
```

---

## 🎉 סיימת!

### פקודות חשובות לזכור:

```bash
# ראה סטטוס
pm2 status

# ראה לוגים
pm2 logs fc-masters

# אתחל שרת
pm2 restart fc-masters

# אתחל Nginx
sudo systemctl reload nginx
```

---

## 📞 עזרה

אם משהו לא עובד:
```bash
# בדוק לוגים
pm2 logs fc-masters --lines 50

# בדוק Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# בדוק שהדומיין מצביע נכון
ping YOUR-DOMAIN.com
```

---

**בהצלחה! 🚀**

**זמן כולל: ~60 דקות**

</div>

