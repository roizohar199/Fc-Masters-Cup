# מערכת ניהול טורניר ברקט מלא 🏆

## מה הוסף?

מערכת מלאה ליצירת וניהול טורנירים עם:
- ✅ יצירת טורניר והגרלה מיידית של 16 שחקנים לשמינית
- ✅ שיוך ידני של שחקנים לכל שלב (16/8/4/2)
- ✅ עדכונים חיים (SSE) לכל הצופים
- ✅ התראות + מיילים אוטומטיים (fallback אם SMTP לא מוגדר)
- ✅ מסך אדמין אחד ליצירה וניהול כל השלבים
- ✅ עמוד ציבורי שמראה את הברקט החי

## איך להשתמש?

### 1. מסך האדמין
🔗 **כניסה:** [http://localhost:8787/admin/tournaments/manual](http://localhost:8787/admin/tournaments/manual)

**תהליך יצירת טורניר:**
1. מלא פרטי הטורניר (שם, משחק, תאריך)
2. בחר 16 שחקנים לשמינית הגמר (לחץ על כפתור "שמינית")
3. לחץ "צור טורניר" - המערכת תיצר אוטומטית את המשחקים
4. לאחר שהמשחקים הסתיימו, בחר 8 מנצחים ולחץ "שמור רבע"
5. המשך כך עד הגמר

**אפשרויות נוספות:**
- חיפוש שחקנים לפי שם/מייל/PSN
- שליחת מיילים אוטומטית לנבחרים
- תצוגת מצב בזמן אמת של הברקט

### 2. עמוד הצפיה הציבורי
🔗 **כניסה:** `http://localhost:8787/tournaments/[ID]/live`

- מתעדכן אוטומטית כשמנהל משנה משהו
- מראה את כל השלבים: שמינית → רבע → חצי → גמר
- מציג מנצחים ומצב המשחקים

### 3. גישה מהמסך הראשי
- **מנהל:** בדף האדמין יש כפתור חדש **"🎯ניהול טורניר ידני (חדש!)"**
- **ציבור:** ניתן לשתף קישור ישיר לעמוד הצפיה

## API החדש

### יצירת טורניר
```bash
POST /api/admin/tournaments/create
{
  "name": "FC Cup – טורניר שישי",
  "game": "FC25",
  "startsAt": "2025-10-27T20:00:00.000Z",
  "seeds16": [1,2,3...16],
  "sendEmails": true
}
```

### שיוך שחקנים לשלב
```bash
POST /api/admin/tournaments/:id/assign
{
  "round": "QF",
  "userIds": [1,2,3,4,5,6,7,8]
}
```

### קביעת מנצח
```bash
POST /api/admin/tournaments/:id/match/:matchId/winner
{
  "winnerUserId": 123
}
```

### צפיה בברקט (ציבורי)
```bash
GET /api/tournaments/:id/bracket
```

### עדכונים חיים (SSE)
```bash
GET /api/tournaments/:id/stream
```

## מבנה הנתונים החדש

### טבלאות נוספות:
- `tournament_players` - שיוך שחקנים לשלבים
- `matches` - משחקים לכל שלב
- הרחבת `tournaments` עם `current_stage`, `is_active`, `deadline`
- הרחבת `notifications` עם `user_id`

### סכימה בטוחה:
- המערכת לא משבירה נתונים קיימים
- מוסיפה רק עמודות חדשות במידת הצורך
- תואמת למערכת הטורנירים הקיימת

## התראות ומיילים

המערכת שולחת מיילים אוטומטית:
- ✉️ **בעת יצירת טורניר:** הודעה לכל 16 הנבחרים
- ✉️ **בעת עדכון שלב:** הודעה למתקדמים לשלב הבא

**Fallback חכם:** אם SMTP לא מוגדר, המערכת רק תדפיס הודעה לוג ולא תיכשל.

## עדכונים חיים (Real-time)

- **Server-Sent Events (SSE)** לעדכון מיידי של הברקט
- הצופים רואים שינויים בזמן אמת ללא רענון
- מחוון חיבור ירוק בעמוד הצפיה

## פתרון בעיות

### שרת לא עולה?
```bash
cd server
npm run build
npm start
```

### לקוח לא נטען?
```bash
cd client  
npm run build
```

### לא רואה את הכפתור החדש?
- וודא שאתה מחובר כמנהל
- רענן את הדפדפן (Ctrl+F5)

### SSE לא עובד?
- בדוק שהנתיב `/api/tournaments/:id/stream` פתוח
- וודא שאין חסימת CORS
- בדוק קונסול לשגיאות

## קבצים שנוצרו/עודכנו

### Server:
- `server/src/utils/ensureSchema.ts` - ניהול סכימת DB
- `server/src/utils/notify.ts` - מערכת התראות
- `server/src/utils/sendEmailSafe.ts` - שליחת מיילים בטוחה
- `server/src/routes/manualBracket.ts` - API מלא לברקט
- `server/src/index.ts` - חיבור הrouter החדש

### Client:
- `client/src/utils/fetchJSON.ts` - עדכן להיות יותר חכם
- `client/src/pages/admin/ManualBracketManager.tsx` - מסך אדמין מלא
- `client/src/pages/public/TournamentBracketLive.tsx` - עמוד צפיה חי
- `client/src/main.tsx` - routing לעמודים החדשים
- `client/src/pages/AdminDashboard.tsx` - הוסף קישור למסך החדש

---

**🚀 המערכת מוכנה לשימוש!**

נסה ליצור טורניר חדש ולראות איך הכל עובד בזמן אמת. בהצלחה! 🏆
