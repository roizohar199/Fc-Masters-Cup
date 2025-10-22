# 🧹 מדריך ניקוי תהליכי PM2

## הבעיה
לפעמים נוצרים תהליכי PM2 מיותרים עם שמות שונים:
- `fc-masters` ✅ (הנכון)
- `fcmasters` ❌ (לא נכון)
- `fc-masters-cup` ❌ (לא נכון)
- `fc-masters-backend` ❌ (לא נכון)

## הפתרון

### 🖥️ על Windows (PowerShell)
```powershell
# הרץ את הסקריפט
.\cleanup-pm2-processes.ps1
```

### 🐧 על Linux/Server (Bash)
```bash
# הרץ את הסקריפט
chmod +x cleanup-pm2-processes.sh
./cleanup-pm2-processes.sh
```

### 🔧 ניקוי ידני
אם אתה על השרת, הרץ את הפקודות הבאות:

```bash
# עצור תהליכים מיותרים
pm2 stop fcmasters
pm2 delete fcmasters

pm2 stop fc-masters-cup
pm2 delete fc-masters-cup

pm2 stop fc-masters-backend
pm2 delete fc-masters-backend

# וידוא ש-fc-masters רץ
pm2 restart fc-masters

# שמירת התצורה
pm2 save

# בדיקת הסטטוס
pm2 list
```

## ✅ תוצאה צפויה
אחרי הניקוי, אמור להיות רק תהליך אחד:
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ fc-masters   │ default     │ 1.0.0   │ fork    │ 12345    │ 1m     │ 0    │ online    │ 0%       │ 54.5mb   │ root     │ disabled │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## 🔍 בדיקות נוספות

### בדיקת לוגים
```bash
pm2 logs fc-masters
```

### בדיקת פורטים
```bash
netstat -tuln | grep :8787
```

### בדיקת זיכרון
```bash
pm2 monit
```

## 🚨 אם משהו לא עובד

1. **התהליך לא קיים:**
   ```bash
   pm2 start server/dist/index.js --name fc-masters
   ```

2. **התהליך לא רץ:**
   ```bash
   pm2 restart fc-masters
   ```

3. **שגיאת build:**
   ```bash
   npm run build
   ```

4. **איפוס מלא:**
   ```bash
   pm2 delete all
   pm2 start server/dist/index.js --name fc-masters
   pm2 save
   ```

## 📝 הערות חשובות

- **תמיד** השתמש בשם `fc-masters` (עם מקף)
- **אל תמחק** את התהליך `fc-masters` - זה התהליך הנכון
- **שמור** תמיד את התצורה עם `pm2 save`
- **בדוק** תמיד את הסטטוס עם `pm2 list`

## 🎯 מניעה עתידית

הסקריפט `deploy.sh` עודכן כדי למנוע יצירת תהליכים כפולים בעתיד. הוא ינקה אוטומטית תהליכים מיותרים לפני יצירת התהליך הנכון.
