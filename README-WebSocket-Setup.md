# 🔌 הגדרת WebSocket ל-Nginx - מדריך מהיר

## 📦 מה יש בחבילה?

קבצים אלו מכילים תצורה מלאה להפעלת WebSocket ב-Nginx עבור מערכת FC Masters Cup.

### 📄 קבצי תצורה
- **`deploy-config-nginx.txt`** - תצורת Nginx ל-HTTP (ללא SSL)
- **`deploy-config-nginx-ssl.txt`** - תצורת Nginx ל-HTTPS/SSL

### 🛠️ כלים
- **`update-nginx-websocket.ps1`** - סקריפט אוטומטי להעלאה
- **`הוראות-WebSocket-Nginx.md`** - מדריך מפורט
- **`סיכום-WebSocket-Nginx.md`** - סיכום טכני
- **`README-WebSocket-Setup.md`** - הקובץ הנוכחי

---

## 🚀 התחלה מהירה (30 שניות)

### צעד 1: בחר את התצורה המתאימה

```
יש לך SSL/HTTPS? 
├─ כן → השתמש ב-deploy-config-nginx-ssl.txt
└─ לא → השתמש ב-deploy-config-nginx.txt
```

### צעד 2: עדכן את הדומיין

פתח את קובץ התצורה שבחרת וערוך:
```nginx
server_name fcmasters.yourdomain.com www.fcmasters.yourdomain.com;
```
**↓**
```nginx
server_name your-actual-domain.com www.your-actual-domain.com;
```

### צעד 3: העלה לשרת

**דרך א': סקריפט אוטומטי (מומלץ)**
```powershell
# ללא SSL
.\update-nginx-websocket.ps1 -ServerIP "your-server-ip"

# עם SSL
.\update-nginx-websocket.ps1 -ServerIP "your-server-ip" -UseSSL
```

**דרך ב': ידנית**
```bash
# העתק לשרת
scp deploy-config-nginx.txt root@your-server-ip:/tmp/nginx.conf

# בשרת
ssh root@your-server-ip
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/fcmasters
sudo nginx -t
sudo systemctl reload nginx
```

### צעד 4: בדוק שעובד

פתח את האתר שלך, לחץ F12, ובקונסול הרץ:
```javascript
const ws = new WebSocket('wss://your-domain.com/presence');
ws.onopen = () => console.log('✅ Connected!');
```

אם רואה "✅ Connected!" - **הצלחת!** 🎉

---

## 🔍 מה השתנה?

### ✅ לפני
```nginx
location /presence {
    proxy_pass http://localhost:8787;
    # ... חיבורים מתנתקים, timeouts קצרים
}
```

### ✅ אחרי
```nginx
# Map directive חכם
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

location /presence {
    proxy_pass http://localhost:8787;
    proxy_http_version 1.1;
    
    # WebSocket headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    
    # Timeouts ל-7 ימים
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    
    # ללא buffering
    proxy_buffering off;
}
```

### 🎯 תוצאה
- ✅ חיבורים יציבים (עד 7 ימים)
- ✅ ללא ניתוקים מיותרים
- ✅ תמיכה ב-WebSocket על `/api` וגם `/presence`

---

## 📋 שאלות נפוצות

### Q: יש לי SSL אבל זה לא עובד?
**A:** ודא שעדכנת את נתיבי התעודות:
```nginx
ssl_certificate /etc/letsencrypt/live/YOUR-DOMAIN/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/YOUR-DOMAIN/privkey.pem;
```

### Q: איך אני יודע אם WebSocket רץ?
**A:** בדוק את הלוגים:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Server logs
sudo journalctl -u fcmasters -f
```

### Q: איך לקבל SSL חינם?
**A:** השתמש ב-Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Q: השרת לא מאזין על פורט 8787?
**A:** בדוק שהשרת Node.js רץ:
```bash
sudo systemctl status fcmasters
sudo netstat -tulpn | grep 8787
```

### Q: איך אני מחזיר את התצורה הישנה?
**A:** הסקריפט יוצר גיבוי אוטומטי:
```bash
sudo cp /etc/nginx/sites-available/fcmasters.backup-* /etc/nginx/sites-available/fcmasters
sudo systemctl reload nginx
```

---

## 📚 מסמכים נוספים

| מסמך | מה תמצא שם |
|------|------------|
| `הוראות-WebSocket-Nginx.md` | הוראות מפורטות צעד אחר צעד |
| `סיכום-WebSocket-Nginx.md` | פירוט טכני של השינויים |
| זקוק לעזרה? | פתח issue ב-GitHub |

---

## 🔧 פתרון בעיות מהיר

| בעיה | פתרון |
|------|--------|
| `nginx: [emerg] unknown directive "map"` | ה-map directive צריך להיות **לפני** `server {` |
| `502 Bad Gateway` | השרת Node.js לא רץ. הרץ: `sudo systemctl start fcmasters` |
| `Connection timeout` | בדוק שה-firewall מאפשר פורט 80/443 |
| `WebSocket connection failed` | ודא שהדומיין נכון ושהסקריפט `/presence` פעיל |

---

## ✅ Checklist להעלאה

- [ ] בחרתי את קובץ התצורה הנכון (HTTP/HTTPS)
- [ ] עדכנתי את `server_name` לדומיין שלי
- [ ] אם SSL: עדכנתי את נתיבי התעודות
- [ ] העליתי לשרת והרצתי `nginx -t`
- [ ] טענתי מחדש: `systemctl reload nginx`
- [ ] בדקתי ב-Console שה-WebSocket מתחבר

---

## 💡 טיפים

1. **תמיד צור גיבוי** לפני שינויים (הסקריפט עושה זאת אוטומטית)
2. **השתמש ב-SSL** - זה חינם עם Let's Encrypt וחיוני לאבטחה
3. **עקוב אחרי הלוגים** כדי לזהות בעיות מוקדם
4. **בדוק את החיבור** מהדפדפן לפני שמסיימים

---

**נוצר על ידי:** AI Assistant  
**תאריך:** 19 אוקטובר 2025  
**גרסה:** 1.0

**זקוק לעזרה?** ראה את `הוראות-WebSocket-Nginx.md` למדריך מפורט 📖

