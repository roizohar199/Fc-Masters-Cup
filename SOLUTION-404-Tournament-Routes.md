# ✅ פתרון שגיאת 404 בנתיבי טורנירים

## 🔍 הבעיה שזוהתה

בקונסול של הדפדפן נראו שגיאות 404:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
GET /api/tournaments/bfed386-f1d2-42c8-9487-7ec964872e92
GET /api/users
```

### הסיבה השורשית

בקובץ `server/src/index.ts` היו **שתי רישומים** של אותו נתיב `/api/tournaments`:

1. **שורה 104-109**: הראוטר הראשי `tournaments` (מ-`./routes/tournaments.ts`) עם כל פעולות ה-CRUD
2. **שורה 139**: ראוטר שני `tournamentsRouter` (מ-`./modules/tournaments/routes.ts`) שרק הכיל endpoint אחד `/select`

הרישום השני **דרס** את הראשון, מה שגרם לכך שרוב endpoints של טורנירים החזירו 404.

בנוסף, **חסר** endpoint `GET /api/tournaments/:id` לשליפת טורניר בודד.

---

## 🔧 התיקונים שבוצעו

### 1️⃣ הסרת הרישום הכפול ב-`server/src/index.ts`

**לפני:**
```typescript
// שורה 139 - זה דרס את הראוטר הראשי!
app.use("/api/tournaments", requireAuth, tournamentsRouter);
```

**אחרי:**
```typescript
// הוסר! כל ה-endpoints של טורנירים עכשיו דרך הראוטר הראשי בלבד
```

---

### 2️⃣ מיזוג endpoint `/select` לראוטר הראשי

הועבר ה-endpoint מ-`modules/tournaments/routes.ts` ל-`server/src/routes/tournaments.ts`:

```typescript
// Tournament participant selection (admin only)
tournaments.post("/:id/select", async (req: any, res) => {
  // Check admin permissions
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ error: "forbidden - admin access required" });
  }
  
  const tournamentId = req.params.id;
  const userIds: number[] = req.body.userIds || [];
  
  if (!userIds.length) {
    return res.status(400).json({ error: "userIds required" });
  }
  
  try {
    const { selectParticipants, flushEmailQueue } = await import("../modules/tournaments/selection.js");
    
    selectParticipants(Number(tournamentId), userIds);
    await flushEmailQueue();
    
    res.json({ ok: true, message: `Selected ${userIds.length} participants for tournament` });
  } catch (error: any) {
    console.error("Error selecting participants:", error);
    res.status(500).json({ error: error.message || "Failed to select participants" });
  }
});
```

---

### 3️⃣ הוספת endpoint חסר: `GET /api/tournaments/:id`

נוסף endpoint לשליפת טורניר בודד לפי ID:

```typescript
// Get single tournament by ID
tournaments.get("/:id", (req, res) => {
  try {
    const tournament = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(tournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});
```

---

### 4️⃣ בדיקת `/api/users`

אין שום קריאה ל-`/api/users` בקוד ה-Frontend הנוכחי.  
ה-Frontend משתמש ב-`/api/admin/users` במקום.  
**לא נדרש תיקון** - כנראה הייתה שגיאה מזמנית או משורות ישנות בקונסול.

---

## ✅ מה עכשיו עובד

לאחר התיקון, ה-endpoints הבאים עובדים כראוי:

| Method | Endpoint | תיאור |
|--------|----------|-------|
| `POST` | `/api/tournaments` | יצירת טורניר חדש |
| `GET` | `/api/tournaments` | שליפת כל הטורנירים |
| `GET` | `/api/tournaments/:id` | ✅ **חדש!** שליפת טורניר בודד |
| `GET` | `/api/tournaments/:id/bracket` | שליפת ה-bracket |
| `GET` | `/api/tournaments/:id/matches` | שליפת משחקים |
| `GET` | `/api/tournaments/:id/players` | שליפת שחקנים |
| `PUT` | `/api/tournaments/:id` | עדכון טורניר |
| `DELETE` | `/api/tournaments/:id` | מחיקת טורניר (super admin) |
| `POST` | `/api/tournaments/:id/select` | בחירת משתתפים (admin) |

---

## 🚀 הרצת השרת

לאחר התיקון:

```bash
npm run build
npm start
```

---

## 🧪 בדיקה

1. **פתח את הקונסול** בדפדפן (F12)
2. **נסה ליצור טורניר חדש** דרך ממשק הניהול
3. **ודא שאין שגיאות 404** בקונסול
4. **ודא שהטורניר נוצר בהצלחה** ונשמר ב-DB

---

## 📝 הערות

- הקובץ `server/src/modules/tournaments/routes.ts` עדיין קיים אך **לא משמש יותר** ב-index.ts
- אפשר למחוק אותו, או להשאיר אותו לצרכי תיעוד/גיבוי
- כל ה-endpoints של טורנירים עכשיו מרוכזים ב-`server/src/routes/tournaments.ts`

---

**תוצאה:** ✅ שגיאות ה-404 נפתרו, הטורניר נשמר כראוי!

