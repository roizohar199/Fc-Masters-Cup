# מדריך תיקון Deployment - GitHub Actions

## הבעיות שתוקנו

### 1. `cp: cannot stat 'server'` 
**סיבה:** כל `run:` ב-GitHub Actions הוא shell חדש, ולכן `working-directory` לא נשמר בין שלבים.

**פתרון:** שימוש ב-`working-directory` בכל שלב בנפרד, ושימוש ב-`rsync` במקום `cp`.

### 2. `rsync … unlink /sys/power/... Operation not permitted`
**סיבה:** `rsync` קיבל מקור ריק/שגוי וניסה לסנכרן את כל ה-filesystem.

**פתרון:** סינכרון רק של תיקיית `_artifact` שנוצרה במיוחד, עם `mkdir -p` ביעד.

## השינויים שבוצעו

### 1. הפרדת Build מ-Deploy
- **Build Job:** בונה את הפרויקט ויוצר artifact נקי
- **Deploy Job:** מוריד את ה-artifact ומסנכרן לשרת

### 2. שימוש ב-Artifacts
```yaml
# יצירת artifact נקי
- name: Pack artifacts
  run: |
    mkdir -p _artifact/client/dist
    mkdir -p _artifact/server
    rsync -a --delete client/dist/ _artifact/client/dist/
    rsync -a --delete server/ _artifact/server/
    rm -rf _artifact/**/node_modules
```

### 3. סינכרון בטוח
```yaml
# סינכרון רק של ה-artifact
- name: Rsync server
  run: |
    ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "mkdir -p /var/www/fcmasters/server /var/www/fcmasters/client/dist"
    rsync -az --delete \
      --exclude 'node_modules' \
      _artifact/server/ ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/www/fcmasters/server/
    rsync -az --delete \
      _artifact/client/dist/ ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/www/fcmasters/client/dist/
```

## בדיקת השרת

### 1. הרץ את הסקריפט לבדיקה
```bash
# ב-Linux/Mac
chmod +x verify-server-structure.sh
./verify-server-structure.sh

# ב-Windows PowerShell
.\verify-server-structure.ps1
```

### 2. בדיקה ידנית
```bash
# בדיקת מבנה תיקיות
ls -la /var/www/fcmasters/

# יצירת תיקיות אם חסרות
sudo mkdir -p /var/www/fcmasters/server /var/www/fcmasters/client/dist
sudo chown -R $USER:$USER /var/www/fcmasters
```

## הגדרת Secrets ב-GitHub

ודא שיש לך את ה-Secrets הבאים ב-GitHub:

- `SSH_PRIVATE_KEY` - המפתח הפרטי ל-SSH
- `VPS_HOST` - כתובת השרת
- `VPS_USER` - שם המשתמש ב-SSH

## הפעלת ה-Deployment

1. **Commit את השינויים:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Fix GitHub Actions deployment workflow"
   git push origin main
   ```

2. **בדוק ב-GitHub Actions:**
   - לך ל-Repository → Actions
   - בדוק שה-workflow רץ בהצלחה

3. **בדוק בשרת:**
   ```bash
   # בדיקת קבצים
   ls -la /var/www/fcmasters/
   
   # בדיקת PM2
   pm2 list
   pm2 logs fcmasters
   ```

## פתרון בעיות

### אם ה-rsync עדיין נכשל:
```bash
# בדוק הרשאות
ls -la /var/www/fcmasters/
sudo chown -R $USER:$USER /var/www/fcmasters

# בדוק חיבור SSH
ssh $VPS_USER@$VPS_HOST "pwd"
```

### אם PM2 לא עולה:
```bash
# בדוק קבצים
ls -la /var/www/fcmasters/server/

# הפעל ידנית
cd /var/www/fcmasters/server
npm ci --omit=dev
pm2 start dist/index.js --name fcmasters
```

## יתרונות הפתרון החדש

1. **בטוח:** לא מסנכרן קבצי מערכת
2. **נקי:** רק קבצים נדרשים מועלים
3. **מהיר:** הפרדת build מ-deploy
4. **אמין:** בדיקות והרשאות נכונות
5. **גמיש:** קל להוסיף שלבים נוספים
