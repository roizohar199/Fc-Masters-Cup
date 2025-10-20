# ✅ Checklist - תיקון WebSocket 1006

## לפני הפריסה

- [ ] Build מקומי הצליח: `cd server && npm run build`
- [ ] אין שגיאות TypeScript
- [ ] הקבצים הבאים קיימים:
  - [ ] `server/src/index.ts` (מעודכן)
  - [ ] `server/src/presence.ts` (מעודכן)
  - [ ] `nginx-config-websocket-fixed.txt`
  - [ ] `deploy-websocket-fix.ps1`
  - [ ] `fix-websocket-1006-on-server.sh`

## פריסה

### אופציה A: אוטומטי
- [ ] הרץ: `.\deploy-websocket-fix.ps1`
- [ ] וודא שאין שגיאות
- [ ] עבור לשלב "בדיקה"

### אופציה B: ידני

#### 1. Git
- [ ] `git add .`
- [ ] `git commit -m "Fix WebSocket 1006"`
- [ ] `git push origin master`

#### 2. שרת - Pull & Build
- [ ] `ssh root@k-rstudio.com`
- [ ] `cd /var/www/fcmasters`
- [ ] `git pull origin master`
- [ ] `cd server`
- [ ] `npm run build`
- [ ] וודא שיש `dist/index.js`

#### 3. שרת - Nginx
- [ ] גבה: `sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup-$(date +%Y%m%d-%H%M%S)`
- [ ] ערוך: `sudo nano /etc/nginx/sites-available/fcmasters`
- [ ] העתק מ-`nginx-config-websocket-fixed.txt`
- [ ] בדוק: `sudo nginx -t`
- [ ] Reload: `sudo systemctl reload nginx`

#### 4. שרת - Restart
- [ ] `pm2 stop server`
- [ ] `pm2 delete server`
- [ ] `cd /var/www/fcmasters/server`
- [ ] `pm2 start dist/index.js --name server`
- [ ] `pm2 save`

## בדיקה

### בדיקות שרת
- [ ] `pm2 status` - server רץ ו-online
- [ ] `sudo netstat -tlnp | grep 8787` - פורט 8787 מאזין
- [ ] `pm2 logs server --lines 50` - אין שגיאות
- [ ] בלוגים: "WebSocket Server initialized with noServer mode"
- [ ] בלוגים: "Server started successfully on http://localhost:8787"

### בדיקות Nginx
- [ ] `sudo systemctl status nginx` - active (running)
- [ ] `sudo nginx -t` - test is successful
- [ ] `sudo tail -20 /var/log/nginx/error.log` - אין שגיאות WebSocket

### בדיקות דפדפן
- [ ] פתח: https://www.k-rstudio.com
- [ ] פתח DevTools (F12)
- [ ] עבור ל-Console
- [ ] חפש: "✅ WebSocket connected successfully"
- [ ] חפש: "👋 Presence hello: X users"
- [ ] **אין** שגיאות 1006
- [ ] **אין** "WebSocket closed: 1006"

### בדיקות נוספות
- [ ] התחבר כמשתמש
- [ ] בדוק שה-presence counter מעודכן
- [ ] נתק את החיבור ובדוק reconnection
- [ ] בדוק במספר טאבים
- [ ] בדוק במספר דפדפנים

## אם משהו לא עובד

### WebSocket 1006 עדיין מופיע
1. [ ] בדוק `pm2 logs server --err --lines 100`
2. [ ] בדוק `sudo tail -100 /var/log/nginx/error.log`
3. [ ] בדוק שה-build הצליח: `ls -la /var/www/fcmasters/server/dist/index.js`
4. [ ] בדוק שה-map directive קיים: `sudo grep -r "connection_upgrade" /etc/nginx/`
5. [ ] נסה restart כולל: `pm2 restart server && sudo systemctl restart nginx`

### Server לא עולה
1. [ ] בדוק errors: `pm2 logs server --err --lines 100`
2. [ ] נסה להריץ ישירות: `cd /var/www/fcmasters/server && node dist/index.js`
3. [ ] בדוק .env: `cat /var/www/fcmasters/.env | grep CORS_ORIGIN`
4. [ ] rebuild: `npm run build`

### Nginx נכשל
1. [ ] בדוק syntax: `sudo nginx -t`
2. [ ] החזר גיבוי: `sudo cp /etc/nginx/sites-available/fcmasters.backup-* /etc/nginx/sites-available/fcmasters`
3. [ ] בדוק שוב: `sudo nginx -t`
4. [ ] reload: `sudo systemctl reload nginx`

## גיבויים

אם הכל משתבש - החזר גיבוי:

```bash
# Nginx
sudo cp /etc/nginx/sites-available/fcmasters.backup-YYYYMMDD-HHMMSS /etc/nginx/sites-available/fcmasters
sudo systemctl reload nginx

# Code
cd /var/www/fcmasters
git reset --hard HEAD~1
cd server
npm run build
pm2 restart server
```

## סיום

- [ ] WebSocket עובד ללא שגיאות 1006
- [ ] Presence counter מעודכן
- [ ] אין errors בלוגים
- [ ] התיעוד מעודכן
- [ ] הצוות יודע על השינוי

---

**תאריך ביצוע:** ___________  
**מבצע:** ___________  
**סטטוס:** ⬜ הצליח / ⬜ נכשל  
**הערות:** ___________  

**בהצלחה! 🚀**

