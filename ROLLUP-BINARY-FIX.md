# 🔧 תיקון Rollup Binary - Cannot find module '@rollup/rollup-linux-x64-gnu'

## 🎯 הבעיה

ב-GitHub Actions CI, בניית ה-client נכשלת עם:
```
Cannot find module '@rollup/rollup-linux-x64-gnu'
```

זה קורה כי:
- Vite משתמש ב-Rollup לבנייה
- Rollup צריך בינארי ספציפי למערכת הפעלה (Linux בשרת CI)
- npm לפעמים מדלג על `optionalDependencies` (bug ידוע)

## ✅ הפתרון

### 1. הוספת Rollup ו-Binary ל-package.json

```json
{
  "devDependencies": {
    "rollup": "^4.24.0"
  },
  "optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "^4.24.0"
  }
}
```

✨ **חשוב:** שתי החבילות באותה גרסה!

### 2. רענון package-lock.json

```bash
cd client
rm -rf node_modules
npm install --no-audit --fund=false
```

זה מבטיח שהבינארי הלינוקסי ננעל ב-lockfile.

### 3. הקשחת Workflow (כבר בוצע)

ב-`.github/workflows/deploy.yml`:

```yaml
- name: Install client dependencies
  working-directory: client
  env:
    NPM_CONFIG_OPTIONAL: "true"  # ✅ כבר קיים!
  run: |
    if [ -f package-lock.json ]; then
      npm ci --no-audit --fund=false
    else
      npm install --no-audit --fund=false
    fi
```

## 📦 מה השתנה?

### `client/package.json`
```diff
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
+   "rollup": "^4.24.0",
    "typescript": "^5.5.3",
    "vite": "^5.4.0"
- }
+ },
+ "optionalDependencies": {
+   "@rollup/rollup-linux-x64-gnu": "^4.24.0"
+ }
```

### `client/package-lock.json`
- ✅ נוסף `@rollup/rollup-linux-x64-gnu` גרסה 4.52.5
- ✅ ננעל ב-lockfile כ-optional dependency
- ✅ מסונכרן עם package.json

## 🔍 אימות

בדיקה שהבינארי אכן נוסף:
```bash
grep "@rollup/rollup-linux-x64-gnu" client/package-lock.json
```

פלט צפוי:
```json
"@rollup/rollup-linux-x64-gnu": "^4.24.0"
"node_modules/@rollup/rollup-linux-x64-gnu": {
  "version": "4.52.5",
  ...
}
```

## 🚀 תוצאה

- ✅ ה-CI ב-GitHub Actions יבנה את ה-client בהצלחה על Linux
- ✅ הבינארי הלינוקסי יותקן אוטומטית
- ✅ פרודקשן לא מושפע - זו תלות dev בלבד
- ✅ Windows/Mac ממשיכים לעבוד כרגיל (יש להם בינארי משלהם)

## 📝 הערות

### למה optionalDependencies?

- Rollup דורש בינארי **ספציפי** לכל OS
- על Linux: `@rollup/rollup-linux-x64-gnu`
- על Windows: `@rollup/rollup-win32-x64-msvc`
- על Mac: `@rollup/rollup-darwin-x64` / `@rollup/rollup-darwin-arm64`

npm מתקין רק את הבינארי הרלוונטי למערכת שלך.

### אם עדיין יש בעיות?

הוסף בינארים נוספים:
```json
"optionalDependencies": {
  "@rollup/rollup-linux-x64-gnu": "^4.24.0",
  "@rollup/rollup-win32-x64-msvc": "^4.24.0",
  "@rollup/rollup-darwin-x64": "^4.24.0",
  "@rollup/rollup-darwin-arm64": "^4.24.0"
}
```

## 🔗 קישורים

- [Rollup Native Binaries](https://rollupjs.org/)
- [npm optionalDependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#optionaldependencies)
- [Vite Rollup Options](https://vitejs.dev/config/build-options.html#build-rollupoptions)

---

✨ **התיקון מבטיח build יציב ב-CI ללא downtime בפרודקשן!**

