# ⚡ תיקון מהיר - WebSocket על k-rstudio.com

## 🎯 הבעיה
```
WebSocket connection to 'wss://www.k-rstudio.com/presence' failed
WebSocket closed: 1006
```

---

## ✅ פתרון מהיר (3 דקות)

### שלב 1️⃣: הפעל סקריפט אוטומטי

#### Windows:
```powershell
.\update-nginx-ssl.ps1
```

#### Linux/macOS:
```bash
chmod +x update-nginx-ssl.sh
./update-nginx-ssl.sh
```

הכנס:
- שם משתמש SSH (למשל: `root`)
- כתובת שרת (למשל: `k-rstudio.com`)

---

### שלב 2️⃣: אם אין SSL Certificate

אם הסקריפט נכשל עם שגיאת SSL:

```bash
# התחבר לשרת
ssh root@k-rstudio.com

# התקן SSL
sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com

# הפעל שוב את הסקריפט
```

---

### שלב 3️⃣: בדיקה

```powershell
# Windows
.\test-websocket-ssl.ps1

# או פתח בדפדפן
https://www.k-rstudio.com
```

חפש ב־Console (F12):
```
✅ WebSocket connected successfully
```

---

## 🆘 עדיין לא עובד?

### אם WebSocket נכשל (1006):
```bash
# התחבר לשרת
ssh root@k-rstudio.com

# בדוק שהשרת רץ
pm2 status

# אם לא רץ - הפעל
pm2 restart fc-masters

# בדוק לוגים
pm2 logs fc-masters --lines 20
```

### אם יש שגיאת CORS:
```bash
# ודא שב־.env יש:
nano /var/www/fcmasters/server/.env
```

הוסף/עדכן:
```env
CORS_ORIGIN=https://www.k-rstudio.com
```

ואז:
```bash
pm2 restart fc-masters
```

### אם Nginx נכשל:
```bash
# בדוק שגיאות
sudo tail -f /var/log/nginx/error.log

# בדוק תצורה
sudo nginx -t

# טען מחדש
sudo systemctl reload nginx
```

---

## 📋 Check List

- [ ] הפעלתי את הסקריפט (`update-nginx-ssl.ps1` או `update-nginx-ssl.sh`)
- [ ] SSL Certificate מותקן (Certbot)
- [ ] Nginx נטען מחדש בהצלחה
- [ ] השרת Node.js רץ (`pm2 status`)
- [ ] CORS_ORIGIN נכון ב־`.env`
- [ ] הדפדפן מציג "✅ WebSocket connected successfully"

---

## 💡 מדריכים מפורטים

אם אתה רוצה להבין יותר או יש בעיות:
- **מדריך מפורט:** `תיקון-WebSocket-SSL.md`
- **README כללי:** `README-תיקון-WebSocket.md`
- **בדיקה ויזואלית:** `test-websocket-connection.html`

---

## ✨ זהו!

אם עשית את השלבים למעלה, הכל אמור לעבוד עכשיו. 🎉

