# מבנה הפרויקט - FC Masters Cup

## סקירה כללית

```
FC Masters Cup/
├── client/                  # אפליקציית React (צד לקוח)
│   ├── src/
│   │   ├── components/     # קומפוננטות React
│   │   ├── pages/          # עמודים
│   │   ├── styles/         # סגנונות
│   │   ├── api.ts          # קריאות API
│   │   ├── App.tsx         # קומפוננטת ראשית
│   │   └── main.tsx        # נקודת כניסה
│   ├── dist/               # Build output
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                  # שרת Express (צד שרת)
│   ├── src/                # קבצי TypeScript מקור
│   │   ├── routes/         # API routes
│   │   ├── lib/            # פונקציות עזר
│   │   ├── auth.ts         # אימות והרשאות
│   │   ├── db.ts           # חיבור לדאטאבייס
│   │   ├── email.ts        # שליחת מיילים
│   │   ├── index.ts        # נקודת כניסה לשרת
│   │   └── ...
│   ├── dist/               # קבצי JavaScript מקומפלים
│   ├── tests/              # בדיקות יחידה
│   ├── uploads/            # קבצים שהועלו
│   ├── *.mjs               # סקריפטי בדיקה/כלי עזר
│   ├── tournaments.sqlite  # מסד נתונים
│   ├── package.json
│   └── tsconfig.json
│
├── .env                    # משתני סביבה (לא ב-git!)
├── env.example             # דוגמה למשתני סביבה
├── package.json            # Root package.json
├── tsconfig.json           # הגדרות TypeScript root
├── tsconfig.server.json    # הגדרות TypeScript לשרת
├── README.md               # תיעוד ראשי
├── INSTALL-INSTRUCTIONS.md # הוראות התקנה
└── *.md                    # מסמכי תיעוד נוספים
```

## תיקיות חשובות

### `/client`
- **תפקיד**: אפליקציית React עם TypeScript
- **טכנולוגיות**: React, TypeScript, Vite, TailwindCSS
- **הרצה**: `npm run dev` (פיתוח) או `npm run build` (פרודקשן)
- **פורט**: 5173 (פיתוח)

### `/server`
- **תפקיד**: REST API עם Express
- **טכנולוגיות**: Express, TypeScript, SQLite (better-sqlite3)
- **הרצה**: `npm run build && npm start`
- **פורט**: 8787 (ברירת מחדל)

### `/server/src/uploads`
- **תפקיד**: תיקייה לשמירת וידאו/תמונות שהועלו
- **הערה**: צריכה להיווצר אוטומטית אם לא קיימת

### `/server/dist`
- **תפקיד**: קבצי JavaScript מקומפלים מ-TypeScript
- **הערה**: נוצרת אוטומטית ע"י `npm run build`

## קבצים חשובים

### `.env` (שורש הפרויקט)
משתני סביבה חיוניים:
- `PORT` - פורט השרת (ברירת מחדל: 8787)
- `DB_PATH` - נתיב למסד הנתונים
- `JWT_SECRET` - מפתח סודי ל-JWT
- `SMTP_*` - הגדרות SMTP לשליחת מיילים
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - פרטי אדמין ראשוני

**חשוב**: הקובץ הזה לא צריך להיות ב-git! השתמש ב-`env.example` כתבנית.

### `tournaments.sqlite` (ב-`/server`)
מסד הנתונים הראשי של האפליקציה.
- **מיקום**: חייב להיות ב-`server/tournaments.sqlite`
- **גיבוי**: השתמש ב-`server/backup-db.mjs`

## סקריפטים נפוצים

### שרת (Server)
```bash
cd server
npm install          # התקנת תלויות
npm run build        # קומפילציה מ-TypeScript ל-JavaScript
npm start            # הרצת השרת
npm run dev          # הרצה במצב פיתוח (עם hot-reload)
npm test             # הרצת בדיקות
```

### לקוח (Client)
```bash
cd client
npm install          # התקנת תלויות
npm run dev          # הרצה במצב פיתוח
npm run build        # build לפרודקשן
npm run preview      # תצוגה מקדימה של build
```

### סקריפטי עזר (ב-`/server`)
- `check-user.mjs` - בדיקת משתמש ספציפי
- `check-users.mjs` - הצגת כל המשתמשים
- `delete-user.mjs` - מחיקת משתמש
- `reset-user-password.mjs` - איפוס סיסמת משתמש
- `backup-db.mjs` - גיבוי מסד הנתונים
- `test-*.mjs` - סקריפטי בדיקה שונים

## בעיות נפוצות

### שגיאת "EADDRINUSE" (פורט תפוס)
**פתרון**: השרת יבחר אוטומטית פורט אחר (8788, 8789, וכו')
```bash
# או עצור תהליכי Node.js ידנית:
Get-Process -Name "node" | Stop-Process -Force
```

### שגיאת "Cannot find database"
**פתרון**: ודא שה-DB נמצא ב-`server/tournaments.sqlite`
```bash
# בדוק נתיב:
echo $env:DB_PATH
# או השתמש בברירת מחדל
```

### שגיאות SMTP
**פתרון**: ודא שמשתני הסביבה מוגדרים נכון ב-`.env`
```bash
# הרץ בדיקה:
node server/test-send.js
```

### תיקיית `server/server/` מיותרת
**פתרון**: הרץ את `fix-project-structure.ps1`

## תזרים עבודה מומלץ

### פיתוח
1. הרץ את השרת: `cd server && npm run dev`
2. בחלון נפרד, הרץ את הלקוח: `cd client && npm run dev`
3. פתח דפדפן: `http://localhost:5173`

### Deploy (Hostinger)
1. Build את הקליינט: `cd client && npm run build`
2. Build את השרת: `cd ../server && npm run build`
3. העלה את הכל לשרת
4. הגדר משתני סביבה ב-`.env` בשרת
5. הרץ: `npm start` (ב-`/server`)

## תחזוקה

### גיבוי Database
```bash
cd server
node backup-db.mjs
```

### ניקוי קבצים זמניים
```bash
# PowerShell:
.\fix-project-structure.ps1
```

### עדכון תלויות
```bash
# Server
cd server && npm update

# Client
cd ../client && npm update
```

## קישורים מועילים

- [הוראות התקנה](INSTALL-INSTRUCTIONS.md)
- [הגדרת Gmail SMTP](SETUP-GMAIL-SMTP.md)
- [הגדרת Google OAuth](GOOGLE-OAUTH-SETUP.md)
- [הגדרת Tawk.to](TAWK-TO-SETUP.md)

## תמיכה

אם יש בעיות או שאלות, בדוק את הלוגים:
- לוגי שרת: יופיעו בקונסול שבו הרצת את השרת
- לוגי דפדפן: פתח Developer Tools (F12)

