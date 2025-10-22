# 🔧 תיקון בעיית הבעת עניין בטורניר

## הבעיה
משתמשים מביעים עניין בטורניר (מקבלים מייל) אבל הפאנל הניהול לא מציג את הנתונים ב"סטטוס נרשמים לטורניר".

## הסיבה
הבעיה הייתה ב-endpoint `/api/admin/tournament-registrations` שלא חיפש נכון את טורניר ברירת המחדל (`default-tournament`) שבו נשמרות הבעות העניין.

## התיקון שבוצע

### 1. עדכון קובץ `server/src/routes/admin.ts`
```javascript
// לפני התיקון - חיפש רק טורנירים עם status 'collecting'
let tournament = db.prepare(`
  SELECT * FROM tournaments 
  WHERE registrationStatus = 'collecting' 
  ORDER BY createdAt DESC 
  LIMIT 1
`).get() as any;

// אחרי התיקון - חיפש גם את טורניר ברירת המחדל
if (!tournament) {
  // אם אין טורניר פעיל, נחפש את טורניר ברירת המחדל
  tournament = db.prepare(`
    SELECT * FROM tournaments 
    WHERE id = 'default-tournament'
    ORDER BY createdAt DESC 
    LIMIT 1
  `).get() as any;
}
```

### 2. איך זה עובד עכשיו
1. **משתמש מביע עניין** → נשמר ב-`tournament_registrations` עם `tournamentId = 'default-tournament'`
2. **מנהל מקבל מייל** → על הבעת העניין החדשה
3. **פאנל הניהול** → מציג את כל הבעות העניין מטורניר ברירת המחדל

## בדיקה שהתיקון עובד

### 1. הרץ את השרת
```bash
npm run dev
```

### 2. בדוק את הפאנל הניהול
- היכנס לפאנל הניהול
- לחץ על "רענן" ליד "סטטוס נרשמים לטורניר"
- אמור לראות את מספר הנרשמים

### 3. בדיקה עם סקריפט
```bash
node test-tournament-interest-fix.mjs
```

## איך לבדוק שהבעיה נפתרה

### ✅ סימנים שהתיקון עובד:
1. **פאנל הניהול מציג נתונים** - רואה את מספר הנרשמים
2. **רשימת נרשמים** - רואה את שמות המשתמשים שנרשמו
3. **נתונים מעודכנים** - כפתור "רענן" עובד

### ❌ אם עדיין לא עובד:
1. **בדוק שהשרת רץ** - `pm2 status`
2. **בדוק לוגים** - `pm2 logs fc-masters`
3. **בדוק מסד נתונים** - יש טורניר עם ID `default-tournament`
4. **בדוק הרשאות** - המשתמש הוא admin/superadmin

## מבנה הנתונים

### טבלת `tournaments`
```sql
id: 'default-tournament'
title: 'טורניר שישי בערב'
registrationStatus: 'collecting'
registrationCapacity: 100
registrationMinPlayers: 16
```

### טבלת `tournament_registrations`
```sql
tournamentId: 'default-tournament'
userId: [ID של המשתמש]
state: 'registered'
createdAt: [תאריך הבעת העניין]
```

## הערות חשובות

- **טורניר ברירת מחדל** נוצר אוטומטית כשמשתמש מביע עניין
- **כל הבעות עניין** נשמרות באותו טורניר ברירת מחדל
- **המנהל יכול לפתוח טורניר חדש** אחרי שיש 16 שחקנים
- **המערכת שולחת מייל** על כל הבעת עניין חדשה

## פקודות שימושיות

```bash
# בדיקת סטטוס השרת
pm2 status

# בדיקת לוגים
pm2 logs fc-masters

# הפעלה מחדש
pm2 restart fc-masters

# בדיקת מסד נתונים
sqlite3 server/tournaments.sqlite "SELECT * FROM tournaments WHERE id='default-tournament';"
sqlite3 server/tournaments.sqlite "SELECT COUNT(*) FROM tournament_registrations WHERE tournamentId='default-tournament';"
```

עכשיו הפאנל הניהול אמור להציג נכון את כל הבעות העניין! 🎉
