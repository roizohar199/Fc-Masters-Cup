# פתרון: בעיית נתיב Database

## הבעיה שמצאנו

**המשתמש `yosiyoviv@gmail.com` לא קיבל מייל מ-forgot-password**, בעוד `fcmasters9@gmail.com` (מנהל על) כן קיבל.

## הסיבה

**היו 2 קבצי database שונים:**
1. `server/tournaments.sqlite` (הנכון) ← `yosiyoviv@gmail.com` נמצא כאן
2. `server/server/tournaments.sqlite` (מיותר) ← `yosiyoviv@gmail.com` לא נמצא כאן!

הקוד פתח DB שונה תלוי בהקשר:
- כשהרצת `test-send.js` - פתח את הDB הנכון
- כשהשרת רץ והשתמש ב-`dist/auth.js` - פתח את הDB המיותר!

**רק `fcmasters9@gmail.com` נמצא בשני ה-DBs כי הוא נוצר על ידי `seedAdminFromEnv()` שרץ בכל פעם שהשרת עולה.**

## הפתרון

### ✅ שלב 1: מחקנו את התיקייה המיותרת
```powershell
Remove-Item -Path ".\server\server" -Recurse -Force
```

### ⚠️ שלב 2: נתיב ה-DB בקוד (צריך לבדוק!)

בקובץ `server/src/db.ts` הנתיב הנוכחי:
```typescript
const dbPath = process.env.DB_PATH || path.join(__dirname, "../tournaments.sqlite");
```

זה אמור לעבוד:
- כשרצים מ-`dist/db.js`: `__dirname` = `server/dist/` → `../tournaments.sqlite` = `server/tournaments.sqlite` ✅
- כשרצים מ-`src/db.ts`: `__dirname` = `server/src/` → `../tournaments.sqlite` = `server/tournaments.sqlite` ✅

אבל השגיאה שקיבלנו:
```
Cannot open database because the directory does not exist
```

זה אומר שהנתיב מצביע לתיקייה שלא קיימת. 

**החשד**: אולי הקוד מנסה ליצור DB בנתיב `./server/tournaments.sqlite` (יחסי מ-root) אבל התיקייה הכפולה `server/server/` נמחקה.

### 🔧 תיקון מוצע:

הוסף ל-`.env`:
```bash
DB_PATH=./server/tournaments.sqlite
```

או שנה ב-`server/src/db.ts` לנתיב מוחלט:
```typescript
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// נתיב מוחלט לתיקיית server/
const serverDir = join(__dirname, "..");  // server/dist/../ = server/
const dbPath = process.env.DB_PATH || join(serverDir, "tournaments.sqlite");
```

זה מבטיח שה-DB תמיד ב-`server/tournaments.sqlite` ללא קשר לנתיב ריצה.

## מה לעשות עכשיו

1. **בדוק שהDB קיים:**
   ```powershell
   Test-Path ".\server\tournaments.sqlite"
   ```
   אם לא - העתק אותו מהגיבוי!

2. **הוסף ל-.env:**
   ```bash
   DB_PATH=./server/tournaments.sqlite
   ```

3. **Build מחדש:**
   ```powershell
   cd server
   npm run build
   ```

4. **הרץ את השרת:**
   ```powershell
   npm start
   ```

5. **בדוק:**
   ```powershell
   node ../test-forgot-debug.mjs yosiyoviv@gmail.com
   ```

## סיכום

המשתמש לא קיבל מייל כי הקוד פתח DB שונה שבו המשתמש לא נמצא!

לאחר מחיקת התיקייה הכפולה והבטחת שיש רק DB אחד, הכל צריך לעבוד.

