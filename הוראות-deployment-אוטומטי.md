<div dir="rtl" style="text-align: right;">

# 🚀 הוראות Deployment אוטומטי - רועי זוהר

**Repository:** https://github.com/roizohar199/fcmasters  
**זמן ביצוע:** 10-15 דקות

---

## ✅ מה בדיוק עשיתי לך?

יצרתי מערכת שתאפשר לך לעשות **deployment אוטומטי** לשרת!

### לפני:
```
1. בנה את הפרויקט              ⏱️ 2 דקות
2. פתח WinSCP                  ⏱️ 1 דקה  
3. העלה קבצים                  ⏱️ 5 דקות
4. SSH לשרת                    ⏱️ 1 דקה
5. npm install                 ⏱️ 2 דקות
6. PM2 restart                 ⏱️ 1 דקה
═══════════════════════════════════════
   סה"כ: 12 דקות
```

### אחרי:
```
1. git push                    ⏱️ 30 שניות
2. GitHub Actions עושה הכל     ⏱️ אוטומטי!
═══════════════════════════════════════
   סה"כ: 30 שניות!
```

---

## 🎯 מה אתה צריך לעשות עכשיו?

### צעד 1: הרץ את הסקריפט שיצרתי

פתח **PowerShell** בתיקיית הפרויקט:

```powershell
cd "C:\FC Masters Cup"
npm run deploy:setup
```

הסקריפט יעזור לך עם כל השלבים!

---

## 📝 במהלך הריצה - מה תצטרך לעשות?

### 1️⃣ SSH Keys (הסקריפט יעשה)
הסקריפט יוצר מפתחות אוטומטית.

### 2️⃣ העתקה לשרת (אתה תעשה)
הסקריפט יציג לך:
```
---BEGIN PUBLIC KEY---
ssh-rsa AAAA...
---END PUBLIC KEY---
```

**אתה תצטרך:**
1. פתח **PuTTY**
2. התחבר לשרת שלך
3. הרץ:
   ```bash
   mkdir -p ~/.ssh
   nano ~/.ssh/authorized_keys
   ```
4. **הדבק את ה-Public Key** שהסקריפט הציג
5. שמור: `Ctrl+O`, `Enter`, `Ctrl+X`
6. הרץ:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

### 3️⃣ GitHub Secrets (אתה תעשה)

הסקריפט יציג לך את ה-Private Key.

**אתה תצטרך:**
1. לך ל: https://github.com/roizohar199/fcmasters/settings/secrets/actions
2. לחץ **New repository secret** 4 פעמים והוסף:

**Secret 1:**
- Name: `VPS_HOST`
- Value: [ה-IP של השרת מHostinger]

**Secret 2:**
- Name: `VPS_USER`  
- Value: `fcmaster` (או `root` אם זה שם המשתמש שלך)

**Secret 3:**
- Name: `VPS_SSH_KEY`
- Value: [הסקריפט יציג - העתק הכל!]

**Secret 4:**
- Name: `VPS_PORT`
- Value: `22`

### 4️⃣ קובץ .env (אתה תעשה)

**במחשב שלך:**
```powershell
copy .env.production.example .env.production
notepad .env.production
```

**ערוך:**
- `SITE_URL=https://הדומיין-שלך.com`
- `CORS_ORIGIN=https://הדומיין-שלך.com`
- שאר הערכים שלך (מייל, סיסמה, וכו')

**שמור את הקובץ.**

**בשרת (PuTTY):**
```bash
cd /var/www/fcmasters
nano .env
```

הדבק את התוכן של `.env.production` ושמור.

---

## 🎬 צעד אחרון: Push!

אחרי שסיימת את כל השלבים למעלה:

```powershell
git add .
git commit -m "🚀 Setup automatic deployment"
git push origin master
```

**עכשיו תראה את זה רץ:**
https://github.com/roizohar199/fcmasters/actions

---

## ✅ איך אני יודע שזה עבד?

### ב-GitHub:
1. גש ל: https://github.com/roizohar199/fcmasters/actions
2. תראה **"Deploy to Hostinger VPS"**
3. הכל צריך להיות **ירוק** ✅

### בשרת:
```bash
pm2 status
# צריך להיות: fc-masters | online

pm2 logs fc-masters
# צריך להיות: "Server started successfully"
```

### בדפדפן:
```
https://הדומיין-שלך.com
```

---

## 🔄 מעכשיו - תהליך העבודה שלך

```powershell
# עשה שינויים בקוד
# בדוק מקומית
npm run dev

# הכל עובד? Push!
git add .
git commit -m "עדכון חדש"
git push origin master

# GitHub Actions יעשה הכל אוטומטית! 🚀
```

---

## 📋 Checklist מהיר

לפני שמתחיל, ודא:

- [ ] יש לך גישה לשרת (PuTTY)
- [ ] יש לך את ה-IP של השרת
- [ ] יש לך שם משתמש וסיסמה לשרת
- [ ] יש לך גישה ל-GitHub Repository
- [ ] PowerShell פתוח בתיקיית הפרויקט

**מוכן? הרץ:**
```powershell
npm run deploy:setup
```

---

## 🆘 בעיות נפוצות

### הסקריפט לא רץ?
```powershell
# נסה ישירות:
.\setup-github-deployment.ps1

# אם יש שגיאת execution policy:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-github-deployment.ps1
```

### SSH לא עובד?
ודא ש:
- ה-Public Key הועתק נכון לשרת
- הרצת `chmod 600 ~/.ssh/authorized_keys` בשרת
- שם המשתמש וה-IP נכונים

### GitHub Actions נכשל?
בדוק ש:
- 4 ה-Secrets נוספו ב-GitHub
- ה-Private Key המלא הועתק (כולל BEGIN/END)
- השרת פועל והקבצים בנתיב הנכון

---

## 📞 קבצי עזרה

אם משהו לא ברור:

- **START-HERE.md** - הוראות התחלה
- **DEPLOYMENT-CHECKLIST.md** - רשימת בדיקה מפורטת  
- **GITHUB-DEPLOYMENT-SETUP.md** - מדריך מלא עם הסברים

---

## 🎉 בהצלחה!

**עכשיו לך והרץ:**

```powershell
npm run deploy:setup
```

**הסקריפט ילווה אותך בכל שלב!** 💪

מוכן? **GO!** 🚀

</div>

