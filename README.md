# ⚽ FC Masters Cup - מערכת ניהול טורנירים

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

- **[הוראות-שימוש.md](הוראות-שימוש.md)** - מדריך שימוש מלא בעברית
- **[INSTALL-INSTRUCTIONS.md](INSTALL-INSTRUCTIONS.md)** - הוראות התקנה מפורטות
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

---

**פותח עבור FC Masters Cup Tournament Management System** 

