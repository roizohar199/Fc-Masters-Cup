# תיקון: "Unexpected token '<', '<!doctype...' is not valid JSON"

## 🎯 הבעיה

הקונסול הראה שגיאה:
```
Unexpected token '<', '<!doctype...' is not valid JSON
```

**למה זה קורה?**
- האתר פועל והנתונים מתעדכנים (למשל משתמשים חדשים נרשמים)
- אבל קריאות API מקבלות HTML במקום JSON
- זה קורה כאשר:
  1. **Nginx** מפנה את `/api/...` ל-SPA (`index.html`) בגלל סדר לא נכון של `location`
  2. **Backend** מחזיר דף שגיאה HTML (401/403/500) במקום JSON
  3. הקריאה נופלת ל-**SPA fallback** במקום להגיע ל-API routes

---

## ✅ הפתרון - 3 שכבות הגנה

### 1️⃣ Frontend: `fetchJSON` Wrapper

**קובץ חדש:** `client/src/lib/fetchJSON.ts`

```typescript
export async function fetchJSON<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (ct.includes("application/json")) {
      try {
        const j = JSON.parse(body);
        throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url} | ${j.error || j.message || body}`);
      } catch {
        throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url} | ${body}`);
      }
    }
    // כאן בדרך כלל נקבל '<!doctype html>' – זה מסביר את ה-Unexpected token '<'
    throw new Error(
      `Expected JSON but got ${ct || "unknown"} (HTTP ${res.status}) from ${url}. First 200 chars:\n` +
      body.slice(0, 200)
    );
  }

  if (!ct.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Expected JSON but got ${ct || "unknown"} from ${url}. First 200 chars:\n` + body.slice(0, 200)
    );
  }

  return res.json();
}
```

**שימוש:**
```typescript
import { fetchJSON } from "@/lib/fetchJSON";

// לפני:
const res = await fetch('/api/admin/users');
const data = await res.json(); // 💥 Unexpected token '<'

// אחרי:
const users = await fetchJSON('/api/admin/users'); // ✅ שגיאה ברורה אם זה HTML
```

**עדכון `client/src/api.ts`:**
```typescript
import { fetchJSON } from "./lib/fetchJSON";

export async function api(path: string, init?: RequestInit) {
  return fetchJSON(path, {
    headers: { "Content-Type": "application/json" }, 
    ...init 
  });
}
```

---

### 2️⃣ Backend: JSON Error Responses

**קובץ חדש:** `server/src/errorHandler.ts`

```typescript
export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api/')) {
    return next(err);
  }

  logger.error("api", `Error handling ${req.method} ${req.path}`, err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  
  res.status(status).json({ 
    error: message,
    path: req.path,
    method: req.method
  });
}

export function apiNotFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: "API endpoint not found",
      path: req.path,
      method: req.method
    });
  }
  next();
}
```

**המשמעות:**
- כל שגיאה ב-API (500/404/401/403) תחזיר **JSON** במקום HTML
- אם endpoint לא קיים, תחזור תשובת JSON 404 במקום SPA

---

### 3️⃣ Express: סדר Routes נכון

**עדכון `server/src/index.ts`:**

```typescript
import { apiErrorHandler, apiNotFoundHandler } from "./errorHandler.js";

// ... כל ה-API routes ...
app.use("/api/disputes", requireAuth, disputes);

// ✅ API 404 handler - אחרי כל ה-API routes אבל לפני SPA fallback
app.use(apiNotFoundHandler);

// ✅ שירות קבצים סטטיים
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// ✅ SPA fallback - רק למסלולים שהם לא /api/
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/presence') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  const indexPath = path.join(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error("server", "Failed to send index.html", err);
      res.status(500).json({ error: "Failed to load application" });
    }
  });
});

// ✅ Global error handler - בסוף
app.use(apiErrorHandler);
```

**למה הסדר חשוב?**
1. ✅ כל ה-API routes מוגדרים ראשונים
2. ✅ `apiNotFoundHandler` תופס API routes שלא קיימים
3. ✅ קבצים סטטיים (CSS/JS/images)
4. ✅ SPA fallback רק למסלולי client-side routing
5. ✅ Error handler כללי בסוף

---

## 🚀 העלאה לשרת (Production)

### שלב 1: Build

```bash
# Local (Windows)
npm run build
```

זה יוצר:
- `client/dist/` - קבצי Frontend
- `server/dist/` - קבצי Backend מקומפלים

### שלב 2: העלאה לשרת

```bash
# העתקה לשרת דרך scp או FTP
scp -r client/dist/* user@server:/path/to/app/client/dist/
scp -r server/dist/* user@server:/path/to/app/server/dist/
scp server/src/errorHandler.ts user@server:/path/to/app/server/src/
```

### שלב 3: Restart בשרת

```bash
# SSH לשרת
ssh user@server

# Build backend
cd /path/to/app
npm run build:server

# Restart PM2
pm2 restart fc-masters-backend
pm2 logs fc-masters-backend --lines 50
```

---

## ✨ תוצאות

### לפני התיקון:
```
❌ Unexpected token '<', '<!doctype...' is not valid JSON
❌ הקונסול מלא בשגיאות parsing
❌ לא ברור מה הבעיה
```

### אחרי התיקון:
```typescript
✅ כל קריאת API מחזירה JSON (גם בשגיאות)
✅ שגיאות ברורות: "Expected JSON but got text/html"
✅ הקונסול מראה בדיוק מה חזר מהשרת (200 תווים ראשונים)
✅ קל לזהות אם הבעיה היא Nginx/Backend/Frontend
```

---

## 🔍 איך לבדוק שזה עובד?

### בדיקה 1: API endpoint תקין
```bash
curl -i http://localhost:8787/api/tournaments
# צריך להחזיר:
# Content-Type: application/json
# [{"id":"...","name":"..."}]
```

### בדיקה 2: API endpoint לא קיים
```bash
curl -i http://localhost:8787/api/non-existent
# צריך להחזיר:
# Content-Type: application/json
# {"error":"API endpoint not found","path":"/api/non-existent","method":"GET"}
```

### בדיקה 3: SPA route
```bash
curl -i http://localhost:8787/dashboard
# צריך להחזיר:
# Content-Type: text/html
# <!doctype html>...
```

---

## 📝 סיכום

| בעיה | פתרון |
|------|--------|
| Frontend מקבל HTML במקום JSON | ✅ `fetchJSON` wrapper עם בדיקות |
| Backend מחזיר HTML בשגיאות | ✅ `apiErrorHandler` מחזיר JSON תמיד |
| Nginx/Express מפנים API ל-SPA | ✅ סדר routes נכון + `apiNotFoundHandler` |

**התוצאה:**
- 🎯 כל קריאת API תמיד מקבלת JSON
- 🎯 שגיאות ברורות בקונסול
- 🎯 SPA routing עובד רק למסלולי client
- 🎯 קל לדבג בעיות

---

## 🆘 אם עדיין יש בעיה

אם אחרי התיקון עדיין יש שגיאה "Unexpected token '<'":

1. **בדוק בקונסול** - עכשיו תראה הודעה ברורה:
   ```
   Expected JSON but got text/html from /api/users. First 200 chars:
   <!doctype html><html>...
   ```

2. **בדוק Nginx logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **בדוק Backend logs**:
   ```bash
   pm2 logs fc-masters-backend
   ```

4. **בדוק Network tab** בדפדפן:
   - פתח DevTools → Network
   - סנן ל-"Fetch/XHR"
   - לחץ על קריאה שנכשלה
   - בדוק Response → אם זה HTML, הבעיה ב-Nginx/Backend

---

**תאריך:** 20 אוקטובר 2025
**גרסה:** 1.0
**סטטוס:** ✅ הושלם

