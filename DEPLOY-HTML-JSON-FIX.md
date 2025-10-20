# 🚀 הוראות Deploy - תיקון HTML במקום JSON

## מה תוקן?

תיקנו את הבעיה שבה קריאות API מחזירות HTML במקום JSON, שגורמת לשגיאה:
```
Unexpected token '<', '<!doctype...' is not valid JSON
```

---

## 📦 קבצים שהשתנו

### Frontend (Client):
1. ✅ `client/src/lib/fetchJSON.ts` - **קובץ חדש**
2. ✅ `client/src/api.ts` - עודכן לשימוש ב-`fetchJSON`

### Backend (Server):
1. ✅ `server/src/errorHandler.ts` - **קובץ חדש**
2. ✅ `server/src/index.ts` - עודכן עם error handlers וסדר routes נכון

---

## 🔧 שלבי ההעלאה

### שלב 1️⃣: Build מקומי (Windows)

```powershell
# ודא שאתה בתיקיית הפרויקט
cd "C:\FC Masters Cup"

# Build Frontend + Backend
npm run build

# בדוק שהקבצים נוצרו
dir client\dist
dir server\dist
```

**אם יש שגיאות:**
```powershell
# נקה ו-build מחדש
npm run clean
npm install
npm run build
```

---

### שלב 2️⃣: העתקה לשרת

**אופציה A: דרך PowerShell/SCP**

```powershell
# הגדר משתנים
$SERVER = "your-server-ip"
$USER = "your-username"
$APP_PATH = "/home/$USER/fc-masters-cup"

# העתק client build
scp -r .\client\dist\* ${USER}@${SERVER}:${APP_PATH}/client/dist/

# העתק server build
scp -r .\server\dist\* ${USER}@${SERVER}:${APP_PATH}/server/dist/

# העתק את errorHandler.ts (חדש)
scp .\server\src\errorHandler.ts ${USER}@${SERVER}:${APP_PATH}/server/src/
```

**אופציה B: דרך FTP/FileZilla**

1. התחבר לשרת בFTP
2. העלה את `client/dist/` → `/home/user/fc-masters-cup/client/dist/`
3. העלה את `server/dist/` → `/home/user/fc-masters-cup/server/dist/`
4. העלה את `server/src/errorHandler.ts` → `/home/user/fc-masters-cup/server/src/`

---

### שלב 3️⃣: Build ב-Server (SSH)

```bash
# התחבר לשרת
ssh user@your-server-ip

# עבור לתיקיית האפליקציה
cd /home/user/fc-masters-cup

# ודא ש-errorHandler.ts קיים
ls -la server/src/errorHandler.ts

# Build את ה-backend (TypeScript → JavaScript)
npm run build:server

# בדוק שה-errorHandler.js נוצר
ls -la server/dist/errorHandler.js
```

---

### שלב 4️⃣: Restart Application

```bash
# Restart PM2
pm2 restart fc-masters-backend

# בדוק שהשרת עלה
pm2 status

# צפה בלוגים
pm2 logs fc-masters-backend --lines 50
```

**אם השרת לא עולה:**

```bash
# בדוק שגיאות
pm2 logs fc-masters-backend --err --lines 100

# Restart מלא
pm2 delete fc-masters-backend
pm2 start ecosystem.config.js

# או הפעל ישירות
cd /home/user/fc-masters-cup
NODE_ENV=production node server/dist/index.js
```

---

### שלב 5️⃣: בדיקות

#### בדיקה 1: API מחזיר JSON

```bash
# מתוך ה-server
curl -i http://localhost:8787/api/tournaments

# צריך לראות:
# HTTP/1.1 200 OK
# Content-Type: application/json
# [{"id":"...","name":"..."}]
```

#### בדיקה 2: API 404 מחזיר JSON

```bash
curl -i http://localhost:8787/api/non-existent

# צריך לראות:
# HTTP/1.1 404 Not Found
# Content-Type: application/json
# {"error":"API endpoint not found","path":"/api/non-existent","method":"GET"}
```

#### בדיקה 3: SPA מחזיר HTML

```bash
curl -i http://localhost:8787/dashboard

# צריך לראות:
# HTTP/1.1 200 OK
# Content-Type: text/html
# <!doctype html>...
```

#### בדיקה 4: בדיקה מהדפדפן

1. פתח https://your-domain.com
2. פתח DevTools (F12)
3. עבור ל-Console
4. **לפני התיקון:** היית רואה:
   ```
   ❌ Unexpected token '<', '<!doctype...' is not valid JSON
   ```
5. **אחרי התיקון:** לא אמור להיות שגיאות parsing, או שגיאות ברורות:
   ```
   ✅ Expected JSON but got text/html from /api/xyz. First 200 chars: ...
   ```

---

## ⚠️ בעיות נפוצות

### בעיה 1: "Cannot find module './errorHandler.js'"

**סיבה:** `errorHandler.ts` לא הועתק או לא קומפל

**פתרון:**
```bash
# ודא שהקובץ קיים
ls -la server/src/errorHandler.ts

# Build מחדש
npm run build:server

# בדוק שנוצר
ls -la server/dist/errorHandler.js
```

---

### בעיה 2: עדיין רואה "Unexpected token '<'"

**סיבה:** Cache של הדפדפן

**פתרון:**
1. פתח DevTools (F12)
2. לחץ ימני על כפתור Refresh
3. בחר "Empty Cache and Hard Reload"
4. או: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

---

### בעיה 3: PM2 לא מצא את ה-App

**פתרון:**
```bash
# רשימת כל ה-apps
pm2 list

# אם האפליקציה נקראת אחרת, החלף את השם
pm2 restart your-actual-app-name

# אם אין אפליקציה:
pm2 start ecosystem.config.js
```

---

### בעיה 4: Nginx עדיין מחזיר HTML ל-API

**בדוק את Nginx config:**
```bash
cat /etc/nginx/sites-available/fc-masters-cup
```

**ודא שיש:**
```nginx
location /api/ {
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

location / {
    root /home/user/fc-masters-cup/client/dist;
    try_files $uri $uri/ /index.html;
}
```

**הסדר חשוב!** `/api/` צריך להיות **לפני** `location /`

**אם שינית את Nginx:**
```bash
# בדוק תחביר
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## ✅ Checklist - ודא שהכל עובד

- [ ] ✅ `npm run build` עובד מקומית
- [ ] ✅ `client/dist/` קיים ומלא בקבצים
- [ ] ✅ `server/dist/` קיים ומלא בקבצים
- [ ] ✅ `server/src/errorHandler.ts` הועתק לשרת
- [ ] ✅ `npm run build:server` רץ בשרת
- [ ] ✅ `server/dist/errorHandler.js` קיים בשרת
- [ ] ✅ PM2 עלה בהצלחה (`pm2 status`)
- [ ] ✅ Logs נקיים (`pm2 logs`)
- [ ] ✅ `/api/tournaments` מחזיר JSON (curl test)
- [ ] ✅ `/api/non-existent` מחזיר JSON 404 (curl test)
- [ ] ✅ `/dashboard` מחזיר HTML (curl test)
- [ ] ✅ אין שגיאות "Unexpected token '<'" בקונסול
- [ ] ✅ האתר טוען ועובד תקין

---

## 📞 אם יש בעיה

1. **בדוק Logs:**
   ```bash
   pm2 logs fc-masters-backend --lines 100
   tail -f /var/log/nginx/error.log
   ```

2. **בדוק Network בדפדפן:**
   - פתח DevTools → Network
   - סנן ל-"Fetch/XHR"
   - בדוק איזה responses חזרו (JSON או HTML?)

3. **בדוק Backend ישירות:**
   ```bash
   curl -v http://localhost:8787/api/tournaments
   ```

4. **Restart מלא:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   sudo systemctl restart nginx
   ```

---

**תאריך:** 20 אוקטובר 2025  
**גרסה:** 1.0  
**סטטוס:** ✅ מוכן לפרודקשן

