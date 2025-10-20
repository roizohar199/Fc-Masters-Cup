# 🚀 הוראות הגדרת Redis + Presence System

## 🎯 מה זה פותר?

**הבעיה:** משתמשים נשארים "מחוברים" גם אחרי שסגרו את הדפדפן בטלפון הנייד.

**הפתרון:** Redis + TTL במקום WebSocket disconnect events (שהם לא אמינים במובייל).

---

## 📦 התקנת Redis

### Windows (Local Development)

```powershell
# אופציה 1: Chocolatey
choco install redis-64

# אופציה 2: Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# אופציה 3: Windows Subsystem for Linux (WSL)
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### Linux (Production Server)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

### Docker (כל הפלטפורמות)

```bash
# Run Redis container
docker run -d \
  --name redis \
  -p 6379:6379 \
  --restart unless-stopped \
  redis:alpine

# או עם Docker Compose
cat > docker-compose.yml << EOF
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
EOF

docker-compose up -d
```

---

## ⚙️ הגדרת Environment

### .env File

```bash
# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379

# או עם סיסמה:
# REDIS_URL=redis://:password@127.0.0.1:6379

# או עם SSL:
# REDIS_URL=rediss://username:password@host:port
```

### Production Environment

```bash
# בשרת הייצור
export REDIS_URL="redis://127.0.0.1:6379"

# או אם Redis על שרת נפרד:
export REDIS_URL="redis://redis-server:6379"
```

---

## 🔧 בדיקת Redis

### בדיקה מקומית

```bash
# התחבר ל-Redis CLI
redis-cli

# בדוק חיבור
127.0.0.1:6379> ping
PONG

# בדוק מידע
127.0.0.1:6379> info server
# Server
redis_version:7.0.0
...

# יציאה
127.0.0.1:6379> exit
```

### בדיקה מהאפליקציה

```bash
# Test Redis connection
curl -X POST http://localhost:8787/api/presence/beat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","tournamentId":"test-tournament"}'

# Response: {"ok":true,"ttl":60,"sessionId":"...","timestamp":...}
```

---

## 🚀 Deploy לשרת

### שלב 1: התקנת Redis בשרת

```bash
# SSH לשרת
ssh user@your-server

# התקן Redis
sudo apt update
sudo apt install redis-server

# הגדר Redis
sudo nano /etc/redis/redis.conf

# שנה את השורות הבאות:
# bind 127.0.0.1
# protected-mode yes
# requirepass your-strong-password

# הפעל Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# בדוק שהעובד
sudo systemctl status redis-server
redis-cli ping
```

### שלב 2: העלאת הקוד

```bash
# Build מקומי
npm run build

# העתק לשרת
scp -r .\client\dist\* user@server:/path/to/app/client/dist/
scp -r .\server\dist\* user@server:/path/to/app/server/dist/
scp -r .\server\src\presence\ user@server:/path/to/app/server/src/

# בשרת
ssh user@server
cd /path/to/app

# התקן Redis dependency
npm install redis

# הגדר environment
echo "REDIS_URL=redis://127.0.0.1:6379" >> .env

# Restart PM2
pm2 restart fc-masters-backend
pm2 logs fc-masters-backend --lines 50
```

---

## ✅ בדיקות

### בדיקה 1: Redis Connection

```bash
# בשרת
pm2 logs fc-masters-backend | grep -i redis
# אמור לראות: "Redis connection established successfully"
```

### בדיקה 2: Heartbeat API

```bash
# Test heartbeat
curl -X POST https://your-domain.com/api/presence/beat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","tournamentId":"test-tournament"}'

# Response: {"ok":true,"ttl":60,"sessionId":"...","timestamp":...}
```

### בדיקה 3: Online Status

```bash
# Test online status
curl https://your-domain.com/api/admin/users/online-status

# Response: {"onlineUsers":["test-user"],"total":1,"totalSessions":1,...}
```

### בדיקה 4: TTL Expiration

```bash
# 1. Send heartbeat
curl -X POST https://your-domain.com/api/presence/beat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# 2. Check online status (should show user)
curl https://your-domain.com/api/admin/users/online-status

# 3. Wait 65 seconds (more than TTL of 60)

# 4. Check online status again (should NOT show user)
curl https://your-domain.com/api/admin/users/online-status
```

---

## 🔍 Troubleshooting

### בעיה 1: Redis Connection Failed

```bash
# בדוק שRedis רץ
sudo systemctl status redis-server

# בדוק פורט
netstat -tlnp | grep 6379

# בדוק logs
sudo journalctl -u redis-server -f
```

### בעיה 2: Authentication Failed

```bash
# בדוק סיסמה
redis-cli -a your-password ping

# עדכן .env
REDIS_URL=redis://:your-password@127.0.0.1:6379
```

### בעיה 3: Memory Issues

```bash
# בדוק זיכרון Redis
redis-cli info memory

# הגדר maxmemory
redis-cli config set maxmemory 256mb
redis-cli config set maxmemory-policy allkeys-lru
```

### בעיה 4: Network Issues

```bash
# בדוק חיבור
telnet localhost 6379

# בדוק firewall
sudo ufw status
sudo ufw allow 6379
```

---

## 📊 Monitoring

### Redis Stats

```bash
# מידע כללי
redis-cli info

# מידע על keys
redis-cli info keyspace

# רשימת keys
redis-cli keys "presence:*"

# TTL של key ספציפי
redis-cli ttl "presence:user123:session456"
```

### Application Logs

```bash
# PM2 logs
pm2 logs fc-masters-backend --lines 100

# Redis logs
sudo journalctl -u redis-server -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 התוצאה

### לפני:
```
❌ משתמש סוגר דפדפן בטלפון
❌ WebSocket לא שולח disconnect
❌ משתמש נשאר "מחובר" לנצח
❌ סטטוס לא מדויק
```

### אחרי:
```
✅ Heartbeat כל 20 שניות → Redis עם TTL של 60 שניות
✅ אם לא קיבלנו heartbeat 60 שניות → "לא מחובר"
✅ sendBeacon ביציאה (אמין במובייל)
✅ סטטוס מדויק ו-real-time
✅ עובד גם עם סגירה "מלוכלך" של הדפדפן
✅ עובד עם PM2/Cluster/Restart
```

---

## 📚 קבצים חשובים

1. **`server/src/presence/redisPresence.ts`** - Redis presence management
2. **`server/src/presence/redisSetup.ts`** - Redis connection setup
3. **`client/src/presence/clientPresence.ts`** - Client heartbeat + beacon
4. **`server/src/routes/presence.ts`** - API routes
5. **`client/src/hooks/usePresence.ts`** - React hook
6. **`client/src/hooks/useOnlineStatus.ts`** - Online status polling

---

**תאריך:** 20 אוקטובר 2025  
**גרסה:** 1.0  
**סטטוס:** ✅ מוכן לפרודקשן
