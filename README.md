# ⚽ FC Masters Cup - מערכת ניהול טורנירים

[![Deploy to Hostinger VPS](https://github.com/roizohar199/Fc-Masters-Cup/actions/workflows/deploy.yml/badge.svg)](https://github.com/roizohar199/Fc-Masters-Cup/actions/workflows/deploy.yml)

מערכת מקצועית לניהול טורנירי FC25/FC26 עם מנגנון אנטי-צ'יט מתקדם.

## 🚀 התחלה מהירה

### התקנה
ראה הוראות מפורטות ב-[INSTALL-INSTRUCTIONS.md](INSTALL-INSTRUCTIONS.md)

```bash
# התקן תלויות
npm install
cd server && npm install
cd ../client && npm install

# העתק env.example ל-.env ומלא פרטים
cp env.example .env

# הרץ את המערכת
npm run dev
```

המערכת תעלה ב:
- **שרת**: http://localhost:8787
- **קליינט**: http://localhost:5173

## 📚 תיעוד

### התקנה ופיתוח
- **[INSTALL-INSTRUCTIONS.md](INSTALL-INSTRUCTIONS.md)** - הוראות התקנה מפורטות
- **[הוראות-שימוש.md](הוראות-שימוש.md)** - מדריך שימוש מלא בעברית

### Deployment לפרודקשן
- **[הוראות-התחלה-עכשיו.md](הוראות-התחלה-עכשיו.md)** - 🎉 **כל ההגדרה הושלמה! התחל כאן!**
- **[הוראות-deployment-אוטומטי.md](הוראות-deployment-אוטומטי.md)** - 🎯 מדריך מהיר
- **[START-HERE.md](START-HERE.md)** - 🚀 התחלה עם הסקריפט
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - ✅ Checklist מפורט
- **[GITHUB-DEPLOYMENT-SETUP.md](GITHUB-DEPLOYMENT-SETUP.md)** - 📖 מדריך מלא
- **[מדריך-העלאה-ל-Hostinger-VPS.md](מדריך-העלאה-ל-Hostinger-VPS.md)** - הגדרת VPS ראשונית

### הגדרות נוספות
- **[GOOGLE-OAUTH-SETUP.md](GOOGLE-OAUTH-SETUP.md)** - הגדרת התחברות Google
- **[TAWK-TO-SETUP.md](TAWK-TO-SETUP.md)** - הגדרת צ'אט תמיכה

## 🔐 התחברות ראשונית

אימייל: `admin@fcmasters.com`  
סיסמה: `FCMasters2025!`

**⚠️ שנה את הסיסמה בקובץ .env לפני העלאה לפרודקשן!**

## 🎯 תכונות עיקריות

- ✅ ניהול טורנירים ב-16 שחקנים
- ✅ מערכת براקט אוטומטית (R16 → QF → SF → Final)
- ✅ אנטי-צ'יט: דיווח כפול + PIN + העלאת ראיות
- ✅ ניהול מחלוקות וספורים
- ✅ מערכת משתמשים עם Google OAuth
- ✅ שליחת מיילים אוטומטית
- ✅ צ'אט תמיכה משולב (Tawk.to)
- ✅ לוח מחוונים לשחקנים ומנהלים

## 🛠️ טכנולוגיות

**Backend:** Node.js, Express, TypeScript, SQLite, Passport  
**Frontend:** React, TypeScript, Vite, Zustand  
**אבטחה:** JWT, Argon2, Rate Limiting  
**CI/CD:** GitHub Actions, SSH Deployment

## 🚀 Deployment

### Deployment אוטומטי מ-GitHub

הפרויקט תומך ב-deployment אוטומטי! כל `git push` יעלה אוטומטית לשרת.

**התחלה מהירה:**
```powershell
# הרץ סקריפט הגדרה
.\setup-github-deployment.ps1

# Push והכל יעבוד!
git push origin main
```

📖 **למדריך מפורט:** [QUICK-START-DEPLOYMENT.md](QUICK-START-DEPLOYMENT.md)

### Deployment ידני

אם אתה מעדיף deployment ידני:
```bash
# בשרת
cd /var/www/fcmasters
./deploy.sh
```

---

**פותח עבור FC Masters Cup Tournament Management System** 

