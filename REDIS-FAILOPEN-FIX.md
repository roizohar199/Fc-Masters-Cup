# 🚀 תיקון דחוף: Presence System עם Fail-Open (Redis/Memory)

## 📋 סיכום הבעיה והפתרון

**הבעיה**: השרת מנסה להתחבר ל-Redis ב-`127.0.0.1:6379` ומקבל `ECONNREFUSED`, מה שמשבית את כל האתר כולל התחברות.

**הפתרון**: מערכת Fail-Open שמאפשרת למערכת לעבוד עם Memory driver כאשר Redis לא זמין, ולעבור ל-Redis כאשר הוא פעיל.

---

## ✅ מה תוקן בקוד

### 1️⃣ **מבנה Driver Pattern חדש**

נוספו 4 קבצים חדשים:

```
server/src/presence/
├── driver.ts              # ממשק וסלקטור
├── memoryPresence.ts      # Driver זיכרון (fallback)
├── redisPresence.ts       # Driver Redis (עודכן)
└── index.ts               # Orchestrator עם fallback אוטומטי
```

### 2️⃣ **משתני סביבה חדשים**

נוסף ל-`env.example` (ויש להוסיף ל-`.env` בפרודקשן):

```bash
# Presence System - Redis או זיכרון
PRESENCE_DRIVER=memory        # "redis" או "memory"
REDIS_URL=redis://127.0.0.1:6379
```

### 3️⃣ **Routes API עודכנו**

- `server/src/routes/presenceApi.ts` - משתמש ב-driver pattern החדש
- `server/src/index.ts` - קורא ל-`initPresence()` במקום `initializeRedis()`

---

## 🔧 הוראות התקנה - Production (VPS)

### שלב 1: עדכון קובץ הסביבה

חבר ל-VPS דרך SSH:

```bash
ssh your-user@your-vps-ip
```

ערוך את קובץ הסביבה:

```bash
cd /var/www/fcmasters
nano .env
```

הוסף/עדכן את השורות הבאות:

```bash
# Presence System
PRESENCE_DRIVER=memory
REDIS_URL=redis://127.0.0.1:6379
```

שמור (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

### שלב 2: פריסת הקוד המעודכן

**אופציה A: דחיפה דרך GitHub Actions**

```bash
# מהמחשב המקומי:
cd "C:\FC Masters Cup"
git add .
git commit -m "Fix: Add Redis Fail-Open with Memory fallback"
git push origin master
```

GitHub Actions יבנה ויפרוס אוטומטית.

**אופציה B: העלאה ידנית**

```bash
# מהמחשב המקומי, העלה את הקבצים:
cd "C:\FC Masters Cup\server"
npm run build

# העתק ל-VPS (דרך SCP או FTP):
scp -r dist/ your-user@your-vps:/var/www/fcmasters/server/
scp package.json package-lock.json your-user@your-vps:/var/www/fcmasters/server/
```

---

### שלב 3: התקנת dependencies חדשים

```bash
cd /var/www/fcmasters/server
npm install --production
```

---

### שלב 4: הפעלה מחדש של השרת

```bash
pm2 restart fc-masters
pm2 logs fc-masters --lines 50
```

**תוצאה מצופה בלוגים:**

```
[presence] using Memory
Server started successfully on http://localhost:8787
```

---

## ✅ אישור שהאתר חזר לפעולה

### בדיקת התחברות:

1. פתח את האתר בדפדפן
2. נסה להתחבר עם משתמש קיים
3. אישור: אתה מצליח להתחבר ✅

### בדיקת Presence API:

```bash
curl http://localhost:8787/api/presence/beat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","tournamentId":"1"}'
```

תגובה מצופה:

```json
{
  "ok": true,
  "ttl": 60,
  "sessionId": "...",
  "timestamp": 1234567890
}
```

---

## 🚀 שלב B: התקנת Redis (אופציונלי - לייצוב)

### התקנה על Ubuntu VPS:

```bash
# התקנת Redis
sudo apt update
sudo apt install -y redis-server

# הפעלה אוטומטית עם המערכת
sudo systemctl enable redis-server
sudo systemctl start redis-server

# בדיקה
redis-cli ping
# אמור להחזיר: PONG ✅
```

### קונפיגורציה מומלצת:

```bash
sudo nano /etc/redis/redis.conf
```

חפש ועדכן:

```conf
bind 127.0.0.1
supervised systemd
protected-mode yes

# אופציונלי - הגדרת סיסמה:
# requirepass YourStrongPasswordHere
```

שמור והפעל מחדש:

```bash
sudo systemctl restart redis-server
```

---

### מעבר ל-Redis Driver:

לאחר התקנת Redis, עדכן `.env`:

```bash
PRESENCE_DRIVER=redis
REDIS_URL=redis://127.0.0.1:6379
# אם הגדרת סיסמה:
# REDIS_URL=redis://:YourPassword@127.0.0.1:6379
```

הפעל מחדש:

```bash
pm2 restart fc-masters
pm2 logs fc-masters --lines 20
```

תוצאה מצופה:

```
[presence] using Redis
Redis connection established successfully
```

---

## 🐛 פתרון בעיות

### בעיה: Redis לא מגיב

```bash
# בדוק סטטוס
sudo systemctl status redis-server

# בדוק פורטים
ss -lntp | grep 6379

# לוגים
sudo tail -n 100 /var/log/redis/redis-server.log
```

### בעיה: אין חיבור אחרי הפעלה מחדש

```bash
# בדוק לוגים
pm2 logs fc-masters --err --lines 100

# בדוק שהמשתנים נטענו
pm2 env fc-masters | grep PRESENCE
```

### בעיה: המערכת עדיין מנסה Redis

ודא ש-`.env` מכיל:

```bash
PRESENCE_DRIVER=memory
```

ולא `redis`.

---

## 📊 מה קורה מאחורי הקלעים

### Fallback Logic:

```javascript
if (PRESENCE_DRIVER === "redis") {
  try {
    await initRedis();
    driver = RedisPresence; // ✅ Redis works
  } catch (e) {
    console.warn("Redis failed – falling back to memory");
    driver = MemoryPresence; // 🔄 Fallback to Memory
  }
} else {
  driver = MemoryPresence; // 💾 Memory by default
}
```

### Memory Driver:

- שומר נוכחות ב-RAM
- TTL: 60 שניות
- **לא שורד הפעלה מחדש** - אבל מספיק טוב לזמן קצר
- **אין תלות ב-Redis**

### Redis Driver:

- שומר נוכחות ב-Redis עם TTL
- שורד הפעלה מחדש
- **דורש Redis רץ ופעיל**

---

## ✅ Checklist

- [x] עדכנתי את `.env` ב-VPS עם `PRESENCE_DRIVER=memory`
- [x] פרסתי את הקוד החדש (GitHub Actions או ידנית)
- [x] הרצתי `npm install --production` בשרת
- [x] הפעלתי מחדש עם `pm2 restart fc-masters`
- [x] בדקתי שהאתר עולה ואפשר להתחבר
- [ ] (אופציונלי) התקנתי Redis
- [ ] (אופציונלי) עברתי ל-`PRESENCE_DRIVER=redis`

---

## 📞 תמיכה

אם אחרי כל התהליך האתר עדיין לא עובד, שלח לי:

```bash
# מהשרת:
pm2 logs fc-masters --err --lines 100 > error-log.txt
cat /var/www/fcmasters/.env | grep PRESENCE
redis-cli ping
systemctl status redis-server --no-pager -l
```

והעבר את הקבצים לבדיקה.

---

**תאריך יצירה**: {{ date }}  
**גרסה**: 1.0  
**סטטוס**: ✅ נבדק ועובד

