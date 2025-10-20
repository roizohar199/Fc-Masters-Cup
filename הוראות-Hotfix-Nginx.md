# 🔧 Hotfix Nginx - תמיכה בנתיבים ישנים

## 🎯 הבעיה

הקריאות עפות ל-`/admin/users/online-status` ו-`/tournaments/:id` **בלי** `/api`, ולכן Nginx מחזיר את ה-SPA במקום לשרת.

## ⚡ פתרון מהיר (Hotfix)

### שלב 1: הוסף את הקוד ל-Nginx

**קובץ:** `/etc/nginx/sites-available/fc-masters-cup`

הוסף את הבלוקים הבאים **לפני** ה-`location /` (SPA fallback):

```nginx
# HOTFIX: Legacy endpoints without /api prefix
location ~* ^/admin(?:/|$) {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding   "";
    proxy_connect_timeout 600s;
    proxy_send_timeout    600s;
    proxy_read_timeout    600s;
}

location ~* ^/tournaments(?:/|$) {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding   "";
    proxy_connect_timeout 600s;
    proxy_send_timeout    600s;
    proxy_read_timeout    600s;
}

location ~* ^/users(?:/|$) {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding   "";
    proxy_connect_timeout 600s;
    proxy_send_timeout    600s;
    proxy_read_timeout    600s;
}

location ~* ^/auth(?:/|$) {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding   "";
    proxy_connect_timeout 600s;
    proxy_send_timeout    600s;
    proxy_read_timeout    600s;
}

# Block exact root paths to prevent accidental SPA fallback
location = /admin        { return 404; }
location = /tournaments  { return 404; }
location = /users        { return 404; }
location = /auth         { return 404; }
```

### שלב 2: בדוק תחביר

```bash
sudo nginx -t
```

### שלב 3: Reload Nginx

```bash
sudo systemctl reload nginx
```

### שלב 4: בדיקות

```bash
# בדוק שהנתיבים הישנים עובדים
curl -i https://your-domain.com/admin/users/online-status
curl -i https://your-domain.com/tournaments/123

# בדוק שה-API הרגיל עדיין עובד
curl -i https://your-domain.com/api/tournaments
```

---

## 📋 סדר ה-Locations ב-Nginx

**חשוב!** הסדר חייב להיות:

```nginx
# 1. Static files
location /uploads/ { ... }

# 2. WebSocket
location /presence { ... }

# 3. API (new)
location ~* ^/api(?:/|$) { ... }

# 4. Legacy endpoints (HOTFIX)
location ~* ^/admin(?:/|$) { ... }
location ~* ^/tournaments(?:/|$) { ... }
location ~* ^/users(?:/|$) { ... }
location ~* ^/auth(?:/|$) { ... }

# 5. Block exact paths
location = /admin { return 404; }
location = /tournaments { return 404; }
location = /users { return 404; }
location = /auth { return 404; }

# 6. SPA fallback (LAST!)
location / { ... }
```

---

## ✅ תוצאות

### לפני:
```
❌ /admin/users/online-status → SPA (HTML)
❌ /tournaments/123 → SPA (HTML)
❌ Unexpected token '<' errors
```

### אחרי:
```
✅ /admin/users/online-status → Backend (JSON)
✅ /tournaments/123 → Backend (JSON)
✅ /api/tournaments → Backend (JSON)
✅ /dashboard → SPA (HTML)
```

---

## 🔄 מעבר לטווח הארוך

**המלצה:** אחרי שה-Hotfix עובד, עדכן את הקוד:

1. **החלף כל הקריאות הישנות:**
   ```typescript
   // לפני
   api('/admin/users/online-status')
   
   // אחרי
   api(apiUrl('/admin/users/online-status'))
   ```

2. **הסר את ה-Hotfix מ-Nginx** אחרי שכל הקריאות עודכנו

---

## 🆘 אם יש בעיה

### בדוק Logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backend logs
pm2 logs fc-masters-backend
```

### בדוק Configuration:
```bash
# בדוק תחביר
sudo nginx -t

# ראה את הקונפיג המלא
cat /etc/nginx/sites-available/fc-masters-cup
```

### Test ישירות:
```bash
# Test backend ישירות
curl -i http://localhost:8787/admin/users/online-status

# Test דרך Nginx
curl -i https://your-domain.com/admin/users/online-status
```

---

**תאריך:** 20 אוקטובר 2025  
**גרסה:** 1.0  
**סטטוס:** ✅ Hotfix מוכן
