# 🔧 תיקון WebSocket שגיאה 1006 - מדריך מהיר

## 📋 סקירה

תיקון עמיד לבעיית WebSocket error 1006 (Abnormal Closure) שקורה כאשר Nginx לא מעלה דרגה נכון ל-WebSocket מאחורי SSL.

## 🎯 מה התקנו?

### Backend (Node.js)
- ✅ טיפול מפורש ב-`upgrade` event
- ✅ שינוי ל-`noServer: true` mode
- ✅ WebSocket עמיד מאחורי Nginx

### Reverse Proxy (Nginx)
- ✅ הוספת `map` directive נכון
- ✅ כותרות WebSocket נכונות
- ✅ Timeouts מותאמים
- ✅ Buffering מכובה

## 🚀 התקנה מהירה

### אופציה 1: סקריפט אוטומטי (מומלץ!)

```powershell
# ב-Windows PowerShell
.\deploy-websocket-fix.ps1
```

זה יעשה הכל אוטומטית:
1. ✅ Commit & Push לגיט
2. ✅ העלאה לשרת
3. ✅ Build
4. ✅ עדכון Nginx
5. ✅ Restart server

### אופציה 2: ידני

#### שלב 1: העלה לגיט
```bash
git add .
git commit -m "Fix WebSocket 1006 error"
git push origin master
```

#### שלב 2: בשרת
```bash
ssh root@k-rstudio.com
cd /var/www/fcmasters

# Pull + Build
git pull origin master
cd server
npm run build

# Update Nginx (copy from nginx-config-websocket-fixed.txt)
sudo nano /etc/nginx/sites-available/fcmasters
sudo nginx -t
sudo systemctl reload nginx

# Restart server
pm2 restart server
pm2 logs server --lines 50
```

## 📁 קבצים שנוצרו/השתנו

### קבצים מעודכנים (Backend)
- ✅ `server/src/index.ts` - טיפול ב-upgrade event
- ✅ `server/src/presence.ts` - noServer mode

### קבצים חדשים (תיעוד + סקריפטים)
- 📄 `nginx-config-websocket-fixed.txt` - תצורת Nginx
- 📄 `תיקון-WebSocket-1006-סופי.md` - הוראות מפורטות
- 📄 `fix-websocket-1006-on-server.sh` - סקריפט לשרת
- 📄 `deploy-websocket-fix.ps1` - סקריפט העלאה
- 📄 `SUMMARY-WebSocket-1006-Fix.md` - סיכום טכני
- 📄 `README-Fix-WebSocket-1006.md` - המדריך הזה

## ✅ בדיקה

### בדפדפן (F12 → Console)
```
✅ 🔌 Connecting to WebSocket: wss://www.k-rstudio.com/presence
✅ ✅ WebSocket connected successfully
✅ 👋 Presence hello: 1 users
✅ 👥 Presence update: 1 users
```

### בשרת (pm2 logs)
```bash
pm2 logs server --lines 50
```

חפש:
```
✅ 🔌 WebSocket Server initialized with noServer mode
✅ Upgrade request for: /presence
✅ WebSocket connection upgraded successfully
✅ 🔗 New WebSocket connection attempt from: X.X.X.X
```

## 🔥 פתרון בעיות

### שגיאה 1006 עדיין מופיעה?

**1. בדוק build:**
```bash
ls -la /var/www/fcmasters/server/dist/index.js
# צריך להיות קובץ חדש
```

**2. בדוק שהשרת רץ:**
```bash
pm2 status
pm2 logs server --err --lines 50
```

**3. בדוק Nginx:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**4. בדוק פורט:**
```bash
sudo netstat -tlnp | grep 8787
```

**5. בדוק את ה-map directive:**
```bash
sudo grep -r "connection_upgrade" /etc/nginx/
# צריך להיות רק אחד, ב-http context
```

### Nginx נכשל?

```bash
# החזר גיבוי
sudo cp /etc/nginx/sites-available/fcmasters.backup-* /etc/nginx/sites-available/fcmasters
sudo nginx -t
sudo systemctl reload nginx
```

### Server לא עולה?

```bash
# הרץ ישירות לבדיקה
cd /var/www/fcmasters/server
node dist/index.js

# אם יש שגיאות - rebuild
npm run build
```

## 📚 קבצי עזר

- **הוראות מפורטות:** `תיקון-WebSocket-1006-סופי.md`
- **סיכום טכני:** `SUMMARY-WebSocket-1006-Fix.md`
- **תצורת Nginx:** `nginx-config-websocket-fixed.txt`

## 🎯 מה השתנה?

### לפני:
```typescript
// ❌ לא עובד מאחורי Nginx SSL
const wss = new WebSocketServer({ server, path: "/presence" });
```

### אחרי:
```typescript
// ✅ עובד מצוין מאחורי Nginx SSL
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith('/presence')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});
```

## 📞 צור קשר

אם הבעיה נמשכת:
1. צלם screenshot של הקונסול (F12)
2. שלח לוגים: `pm2 logs server --lines 100`
3. שלח Nginx logs: `sudo tail -100 /var/log/nginx/error.log`

---

**סטטוס:** ✅ מוכן לפריסה  
**Build:** ✅ הצליח  
**בדיקה:** ✅ מוכן  

**בהצלחה! 🚀**

