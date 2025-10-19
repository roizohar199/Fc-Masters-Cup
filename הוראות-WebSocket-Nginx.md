# 🔌 הפעלת WebSocket ב-Nginx - הוראות העלאה

## ✅ מה עודכן?

עדכנתי את קובץ `deploy-config-nginx.txt` עם תמיכה מושלמת ב-WebSocket.

### השינויים שבוצעו:

1. **הוספת Map Directive** - מגדיר את ה-Connection header בצורה דינמית:
   ```nginx
   map $http_upgrade $connection_upgrade {
       default upgrade;
       '' close;
   }
   ```

2. **עדכון location /api** - תמיכה ב-WebSocket גם דרך ה-API:
   - שינוי `Connection 'upgrade'` ל-`Connection $connection_upgrade`
   - הוספת timeouts של 7 ימים ל-WebSocket connections

3. **שיפור location /presence** - המיקום הייעודי ל-WebSocket:
   - שימוש ב-`$connection_upgrade` במקום ערך קבוע
   - הוספת `proxy_buffering off` למניעת buffering של הודעות
   - timeouts של 7 ימים לחיבורים ממושכים

## 🚀 הוראות העלאה לשרת

### ⚡ דרך מהירה: שימוש בסקריפט אוטומטי

#### ללא SSL (HTTP בלבד)
```powershell
.\update-nginx-websocket.ps1 -ServerIP "your-server-ip"
```

#### עם SSL (HTTPS)
```powershell
.\update-nginx-websocket.ps1 -ServerIP "your-server-ip" -UseSSL
```

הסקריפט יטפל בכל השלבים אוטומטית: גיבוי, העלאה, בדיקת תקינות, ו-reload.

---

### 🔧 דרך ידנית (אם אתה מעדיף שליטה מלאה)

#### קודם כל: בחר את קובץ התצורה המתאים
- **ללא SSL**: `deploy-config-nginx.txt`
- **עם SSL**: `deploy-config-nginx-ssl.txt`

### שלב 1: גישה לשרת
```bash
ssh root@your-server-ip
```

### שלב 2: גיבוי התצורה הקיימת
```bash
sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup
```

### שלב 3: העלאת התצורה החדשה

יש לך שתי אפשרויות:

#### אפשרות א': העתקה ישירה מהמחשב המקומי

**ללא SSL:**
```bash
# מהמחשב שלך (לא מהשרת), הרץ:
scp deploy-config-nginx.txt root@your-server-ip:/tmp/nginx-config.txt

# אז בשרת:
ssh root@your-server-ip
sudo cp /tmp/nginx-config.txt /etc/nginx/sites-available/fcmasters
```

**עם SSL:**
```bash
# מהמחשב שלך (לא מהשרת), הרץ:
scp deploy-config-nginx-ssl.txt root@your-server-ip:/tmp/nginx-config.txt

# אז בשרת:
ssh root@your-server-ip
sudo cp /tmp/nginx-config.txt /etc/nginx/sites-available/fcmasters
```

#### אפשרות ב': עריכה ישירה בשרת
```bash
# בשרת:
sudo nano /etc/nginx/sites-available/fcmasters
```

אז העתק את התוכן של `deploy-config-nginx.txt` (או `deploy-config-nginx-ssl.txt`) והדבק אותו.

### שלב 4: בדיקת תקינות התצורה
```bash
sudo nginx -t
```

אם הכל תקין, תראה:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### שלב 5: טעינה מחדש של Nginx
```bash
sudo systemctl reload nginx
```

או אם צריך restart מלא:
```bash
sudo systemctl restart nginx
```

### שלב 6: בדיקת סטטוס
```bash
sudo systemctl status nginx
```

## 🧪 בדיקת תקינות WebSocket

### מהדפדפן (Console):
```javascript
// פתח את ה-Console (F12) באתר שלך ונסה:
const ws = new WebSocket('wss://fcmasters.yourdomain.com/presence');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
ws.onmessage = (msg) => console.log('📨 Message:', msg.data);
```

### מהשרת (בדיקת logs):
```bash
# בדיקת logs של Nginx
sudo tail -f /var/log/nginx/error.log

# בדיקת logs של השרת שלך
sudo journalctl -u fcmasters -f
```

## 🔍 פתרון בעיות נפוצות

### בעיה: WebSocket לא מתחבר (404/502)
**פתרון:**
1. ודא שהשרת Node.js רץ ומאזין על פורט 8787:
   ```bash
   sudo netstat -tulpn | grep 8787
   ```
2. בדוק את ה-logs של Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### בעיה: Connection timeout
**פתרון:**
1. ודא שה-timeouts מוגדרים כראוי (7d)
2. בדוק שה-firewall מאפשר חיבורים:
   ```bash
   sudo ufw status
   ```

### בעיה: Upgrade header לא נשלח
**פתרון:**
- ודא שה-`map` directive נמצא **מחוץ** ל-`server` block
- צריך להיות בתחילת הקובץ

## 📝 הערות חשובות

1. **עדכן את server_name**: 
   החלף `fcmasters.yourdomain.com` בדומיין האמיתי שלך

2. **SSL/HTTPS**: 
   אם יש לך SSL certificate, השתמש ב-`deploy-config-nginx-ssl.txt` שכולל:
   - ✅ הפניה אוטומטית מ-HTTP ל-HTTPS
   - ✅ תצורת SSL מאובטחת (TLS 1.2/1.3)
   - ✅ Security headers מומלצים
   - ✅ OCSP stapling
   - ✅ תמיכה ב-Let's Encrypt

   **עדכן את הנתיבים לתעודות SSL:**
   ```nginx
   ssl_certificate /etc/letsencrypt/live/YOUR-DOMAIN/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/YOUR-DOMAIN/privkey.pem;
   ssl_trusted_certificate /etc/letsencrypt/live/YOUR-DOMAIN/chain.pem;
   ```

3. **WebSocket דרך HTTPS**:
   הקליינט צריך להתחבר ל-`wss://` (ולא `ws://`) כשיש SSL

4. **קבלת תעודת SSL חינם (Let's Encrypt)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d fcmasters.yourdomain.com -d www.fcmasters.yourdomain.com
   ```

## ✨ מה התצורה החדשה מאפשרת?

- ✅ חיבורי WebSocket ממושכים (עד 7 ימים)
- ✅ תמיכה ב-WebSocket גם דרך `/api` וגם דרך `/presence`
- ✅ ניהול נכון של Upgrade headers
- ✅ ללא buffering של הודעות WebSocket
- ✅ תמיכה בחיבורים מרובים בו-זמנית
- ✅ Proxy headers מלאים לזיהוי נכון של לקוחות

## 📞 תמיכה נוספת

אם נתקלת בבעיות, בדוק:
1. Logs של Nginx: `/var/log/nginx/error.log`
2. Logs של השרת: `sudo journalctl -u fcmasters -f`
3. ודא שהשרת Node.js רץ: `ps aux | grep node`

