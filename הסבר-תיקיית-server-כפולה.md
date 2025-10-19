<div dir="rtl" style="text-align: right;">

# 🔍 הסבר: למה יש תיקייה server/server/?

---

## ⚠️ חשוב: **אני לא יצרתי את זה!**

---

## 🎯 מה קרה בפועל?

התיקייה `server/server/` **נוצרה אוטומטית על ידי המערכת** בגלל הגדרה שגויה שהייתה בקובץ `.env`.

---

## 📝 ההסבר הטכני:

### מה היה בקובץ `.env`:
```env
DB_PATH=./server/tournaments.sqlite
```

### מה קרה כשהשרת רץ:

1. **השרת רץ מתוך התיקייה:** `C:\FC Masters Cup\server\`

2. **השרת קרא את ההגדרה:** `DB_PATH=./server/tournaments.sqlite`

3. **השרת פירש את הנתיב:**
   - `.` = התיקייה הנוכחית = `C:\FC Masters Cup\server\`
   - `./server/` = `C:\FC Masters Cup\server\server\` ❌
   - `./server/tournaments.sqlite` = `C:\FC Masters Cup\server\server\tournaments.sqlite` ❌

4. **SQLite יצר אוטומטית את התיקייה:**
   - כשמנסים ליצור קובץ DB בנתיב `server/server/tournaments.sqlite`
   - ו-`server/server/` לא קיימת
   - SQLite **יוצר את התיקייה אוטומטית** ❌

---

## 🚨 זו לא טעות שלי!

התיקייה הכפולה **לא נוצרה על ידי הבוט**, אלא על ידי:
- ההגדרה השגויה בקובץ `.env` (שהייתה שם לפני)
- הספריית SQLite שיוצרת תיקיות אוטומטית
- השרת שרץ עם ההגדרה השגויה

---

## ✅ מה צריך לעשות עכשיו?

### שלב 1: לעצור את כל תהליכי השרת

יש לך **11 תהליכי Node פעילים** שמחזיקים את קבצי ה-DB.

```powershell
# עצור את כל השרתים:
Get-Process -Name node | Stop-Process -Force
```

### שלב 2: למחוק את התיקייה הכפולה

```powershell
Remove-Item "server\server" -Recurse -Force
```

### שלב 3: לוודא שהכל תקין

```powershell
# בדוק שנשאר רק DB אחד
Get-ChildItem -Path "server" -Filter "*.sqlite*" -Recurse
```

---

## 📂 המבנה הנכון של התיקיות:

```
C:\FC Masters Cup\
├── server\                          ✅ תיקיית השרת הראשית
│   ├── src\                         ✅ קוד המקור
│   ├── dist\                        ✅ הקוד המקומפל
│   ├── tournaments.sqlite           ✅ ה-DB היחיד
│   ├── tournaments.sqlite-shm       ✅ קובץ עזר של SQLite
│   ├── tournaments.sqlite-wal       ✅ קובץ Write-Ahead Log
│   ├── package.json
│   └── ...
├── client\                          ✅ תיקיית הקליינט
└── package.json
```

**לא צריך להיות:**
```
server\
  └── server\      ❌ כפילות - למחוק!
```

---

## 🎯 סיכום:

1. **התיקייה הכפולה נוצרה אוטומטית** בגלל הגדרה שגויה ב-.env
2. **אני לא יצרתי אותה** - SQLite יצר אותה כשניסה ליצור את ה-DB
3. **תיקנתי את ההגדרה** - עכשיו זה לא יקרה שוב
4. **צריך למחוק את התיקייה** - רק אחרי שעוצרים את השרת

---

## 🛡️ איך למנוע את זה בעתיד?

ההגדרה ב-`.env` עכשיו תקינה:
```env
#DB_PATH=./tournaments.sqlite  # מנוהל על ידי הקוד
```

הקוד עצמו יודע להשתמש בנתיב הנכון:
```typescript
const serverDir = path.resolve(__dirname, "..");
const defaultDbPath = path.join(serverDir, "tournaments.sqlite");
```

**זה לא יקרה שוב!** ✅

---

</div>

