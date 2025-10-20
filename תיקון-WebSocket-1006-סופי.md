# תיקון WebSocket שגיאה 1006 - סופי ועמיד

## מה השתנה?

### 1. **צד ה-Node (Backend)** ✅
- **server/src/index.ts**: עודכן לטפל ב-`upgrade` event באופן מפורש
- **server/src/presence.ts**: עודכן ל-`noServer: true` mode
- **התוצאה**: WebSocket עכשיו עובד בצורה עמידה מאחורי Nginx עם SSL

### 2. **צד ה-Nginx (Reverse Proxy)** ✅
- **nginx-config-websocket-fixed.txt**: תצורה חדשה ומשופרת
- **התוצאה**: Nginx מעלה דרגה נכון ל-WebSocket

## הוראות העלאה לשרת

### שלב 1: העלה את הקוד המעודכן

```bash
# בתיקיית הפרויקט במחשב המקומי (Windows)
# העלה את הקבצים המעודכנים לשרת

# אופציה 1: דרך Git
git add server/src/index.ts server/src/presence.ts
git commit -m "Fix WebSocket 1006 error with manual upgrade handling"
git push origin master

# אופציה 2: דרך SCP/SFTP
# העלה את הקבצים:
# - server/src/index.ts
# - server/src/presence.ts
```

### שלב 2: התחבר לשרת והרץ build

```bash
# התחבר לשרת דרך SSH/PuTTY
ssh root@k-rstudio.com
# או דרך PuTTY: 149.50.141.69

# עבור לתיקיית הפרויקט
cd /var/www/fcmasters

# אם העלת דרך Git - pull את השינויים
git pull origin master

# התקן dependencies (אם צריך)
cd server
npm install

# Build את הקוד המעודכן
npm run build

# בדוק שה-build הצליח
ls -la dist/

# חזור לתיקייה הראשית
cd /var/www/fcmasters
```

### שלב 3: עדכן את Nginx

```bash
# גבה את התצורה הנוכחית
sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup-$(date +%Y%m%d-%H%M%S)

# ערוך את התצורה
sudo nano /etc/nginx/sites-available/fcmasters

# העתק את התוכן מ-nginx-config-websocket-fixed.txt
# שים לב: 
# 1. ה-map directive צריך להיות ב-http context (לפני ה-server blocks)
# 2. אם יש לך כבר map ב-/etc/nginx/nginx.conf - אל תכפיל אותו

# בדוק שהתצורה תקינה
sudo nginx -t

# אם הכל בסדר, reload את Nginx
sudo systemctl reload nginx
```

### שלב 4: הפעל מחדש את השרת

```bash
# עצור את השרת הישן
pm2 stop server

# מחק את התהליכים הישנים
pm2 delete server

# הפעל את השרת המעודכן
cd /var/www/fcmasters/server
pm2 start dist/index.js --name server

# שמור את התצורה של pm2
pm2 save

# בדוק שהשרת רץ
pm2 status

# בדוק לוגים
pm2 logs server --lines 50
```

### שלב 5: בדיקה

```bash
# בדוק שהשרת מאזין על פורט 8787
sudo netstat -tlnp | grep 8787

# בדוק לוגים של Nginx
sudo tail -f /var/log/nginx/error.log

# בקליינט - פתח את הקונסול של הדפדפן (F12)
# חפש הודעות:
# ✅ "WebSocket connected successfully"
# ✅ "Presence update: X users"

# אם אתה רואה שגיאות 1006 - בדוק:
pm2 logs server --lines 100
```

## פתרון בעיות

### אם WebSocket עדיין נכשל (1006)

1. **בדוק שהשרת רץ**:
   ```bash
   pm2 status
   pm2 logs server --lines 50
   ```

2. **בדוק Nginx logs**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **בדוק שהפורט 8787 פתוח**:
   ```bash
   sudo netstat -tlnp | grep 8787
   ```

4. **בדוק את ה-map directive**:
   ```bash
   sudo grep -r "connection_upgrade" /etc/nginx/
   # צריך להיות רק אחד, ב-http context
   ```

5. **נסה להתחבר ישירות לשרת** (דרך SSH tunnel):
   ```bash
   # במחשב המקומי
   ssh -L 8787:localhost:8787 root@k-rstudio.com
   
   # בדפדפן, נסה:
   ws://localhost:8787/presence
   ```

### אם הבעיה נמשכת

1. **בדוק CORS_ORIGIN**:
   ```bash
   cat /var/www/fcmasters/.env | grep CORS_ORIGIN
   # צריך להיות: CORS_ORIGIN=https://www.k-rstudio.com
   ```

2. **בדוק SSL certificates**:
   ```bash
   sudo certbot certificates
   ```

3. **הפעל מחדש את כל השירותים**:
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

## תוצאה צפויה

לאחר הביצוע המוצלח:

✅ **בקונסול של הדפדפן (F12)**:
```
🔌 Connecting to WebSocket: wss://www.k-rstudio.com/presence
✅ WebSocket connected successfully
👋 Presence hello: X users
```

✅ **בלוגים של השרת (pm2 logs server)**:
```
🔌 WebSocket Server initialized with noServer mode
Upgrade request for: /presence
WebSocket connection upgraded successfully
🔗 New WebSocket connection attempt from: X.X.X.X
🆕 New user connected: user@example.com
```

✅ **ללא שגיאות 1006!**

## סיכום השינויים

### server/src/index.ts
- ✅ הוסף `import http from "node:http"`
- ✅ צור HTTP server מפורש: `const server = http.createServer(app)`
- ✅ טפל ב-`upgrade` event באופן מפורש
- ✅ קבל את `wss` מ-`attachPresence`

### server/src/presence.ts
- ✅ שנה ל-`noServer: true`
- ✅ החזר את `wss` בתגובה

### nginx-config-websocket-fixed.txt
- ✅ הוסף `map` directive (ב-http context)
- ✅ הוסף headers נכונים ל-WebSocket
- ✅ הוסף timeouts סבירים (600s)
- ✅ הוסף `proxy_buffering off`

---

**אם הכל עובד - מזל טוב! 🎉**
**אם לא - שלח לי screenshot של הקונסול + הלוגים.**

