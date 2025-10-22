# 🚀 מדריך דפלוי אטומי - GitHub Actions

## סקירה כללית

ה-workflow עודכן לתמוך בדפלוי אטומי עם הפרדה מלאה בין Build ו-Deploy.

## 🏗️ מבנה ה-Workflow

### Job 1: Build
- ✅ התקנת תלויות (root, server, client)
- ✅ בניית הקוד (TypeScript → JavaScript)
- ✅ אימות תקינות (`npm ls`)
- ✅ שמירת artifacts לשימוש ב-deploy

### Job 2: Deploy
- ⏳ מתבצע **רק אם** Build הצליח
- ⏳ מתבצע **רק על** branch `master`
- 🔐 משתמש ב-secrets: `SSH_PRIVATE_KEY`, `VPS_HOST`, `VPS_USER`

## 🎯 דפלוי אטומי (Zero-Downtime)

### מבנה התיקיות בשרת

```
/var/www/fcmasters/
├── current/          → symlink לגרסה הפעילה
├── releases/
│   ├── 1234/        (גרסה ישנה)
│   ├── 1235/        (גרסה ישנה)
│   └── 1236/        ← current מצביע כאן
└── shared/          (אופציונלי - לקבצים משותפים)
```

### תהליך הדפלוי

1. **יצירת release חדש** - `releases/{run_number}/`
2. **העלאת קבצים** - rsync לתיקיית ה-release החדשה
3. **התקנת תלויות** - npm ci בתיקיית ה-release (לא ב-current!)
4. **העתקת קבצים קריטיים**:
   - `.env` (הגדרות)
   - `tournaments.sqlite` (מסד נתונים)
5. **החלפה אטומית** - `ln -sfn` משנה symlink ב-פעולה אחת
6. **טעינה מחדש** - PM2/systemd reload/restart
7. **ניקוי** - מחיקת releases ישנים (שומר 5 אחרונים)

## 🔧 הגדרות נדרשות ב-GitHub Secrets

עבור ל-Settings → Secrets and variables → Actions:

```bash
SSH_PRIVATE_KEY   # מפתח SSH פרטי (id_rsa)
VPS_HOST          # כתובת השרת (example.com או IP)
VPS_USER          # שם משתמש SSH (root או אחר)
```

## 📦 קבצים שנשמרים בין גרסאות

- `.env` - משתנים סביבה
- `tournaments.sqlite` - מסד הנתונים

קבצים אלו **לא מוחלפים** בדפלוי - הם מועתקים מה-current הקיים.

## ⚙️ ניהול שירות

ה-workflow מזהה אוטומטית את מנהל התהליכים:

### PM2 (מומלץ)
```bash
pm2 reload fcmasters     # טעינה חלקה
pm2 restart fcmasters    # אם reload נכשל
```

### systemd
```bash
sudo systemctl reload fcmasters    # טעינה חלקה
sudo systemctl restart fcmasters   # אם reload נכשל
```

## 🔄 שחזור גרסה (Rollback)

אם יש בעיה עם גרסה חדשה:

```bash
ssh user@host
cd /var/www/fcmasters
ln -sfn releases/1235 current    # חזרה לגרסה קודמת
pm2 reload fcmasters              # או systemctl reload
```

## 🛠️ שינויים שבוצעו

### ב-`.github/workflows/deploy.yml`:

1. ✅ הוספת `NPM_CONFIG_OPTIONAL: "true"` להתקנת client
2. ✅ הפרדת build ו-deploy לשני jobs נפרדים
3. ✅ העלאת artifacts אחרי build
4. ✅ תנאי הרצת deploy: `needs.build.result == 'success'`
5. ✅ דפלוי אטומי עם releases directory
6. ✅ ניקוי אוטומטי של releases ישנים

### יתרונות:

- 🚀 **Zero downtime** - אין הפרעה למשתמשים
- 🔄 **Rollback מהיר** - ניתן לחזור בקלות
- 🛡️ **בטוח** - התקנת תלויות לא משבשת את האתר החי
- 📊 **ניהול גרסאות** - שמירת 5 גרסאות אחרונות
- ⚡ **Build מופרד** - שגיאת build לא משפיעה על production

## 📝 הערות

- ה-workflow **לא** ירוץ אם ה-build נכשל
- התלויות מותקנות **בתיקיית release בלבד**, לא ב-current
- ה-symlink `current` משתנה **בפעולה אטומית אחת**
- מסד הנתונים נשמר תמיד (לא מוחלף)

## 🧪 בדיקה

לבדוק את המבנה בשרת:

```bash
ssh user@host
cd /var/www/fcmasters
ls -la current          # צריך להיות symlink
ls -la releases/        # רשימת כל ה-releases
readlink current        # איזו גרסה פעילה כרגע
```

---

✨ **הדפלוי החדש מבטיח אמינות גבוהה וזמן השבתה אפסי!**

