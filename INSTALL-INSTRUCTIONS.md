# 🚀 הוראות התקנה והפעלה

## 📋 דרישות מקדימות
- Node.js 18+ מותקן
- npm מותקן

## 🛠️ התקנה

### 1. התקן חבילות
```bash
# התקן חבילות בשורש
npm install

# התקן חבילות בשרת
cd server
npm install

# התקן חבילות בקליינט
cd ../client
npm install
```

### 2. צור קובץ .env
העתק את `.env.example` ל-`.env` בתיקיית השורש:
```bash
# Windows PowerShell
cp .env.example .env

# או ידנית - צור קובץ .env עם התוכן הבא:
```

```env
JWT_SECRET=fc_masters_cup_super_secret_2025_key_change_in_production
ADMIN_EMAIL=admin@fcmasters.com
ADMIN_PASSWORD=FCMasters2025!
CORS_ORIGIN=http://localhost:5173
```

**⚠️ חשוב: בייצור - שנה את הסיסמה!**

### 3. בנה את הפרוייקט
```bash
npm run build
```

### 4. הרץ את המערכת
```bash
npm run dev
```

## 🔐 התחברות

1. פתח דפדפן: http://localhost:5173
2. לחץ על "התחבר" או עבור ל: http://localhost:5173/login
3. השתמש בפרטי ההתחברות:
   - **אימייל**: admin@fcmasters.com
   - **סיסמה**: FCMasters2025!

## ✨ תכונות חדשות

### 🔐 מערכת אימות מלאה
- התחברות מאובטחת עם JWT + Cookies
- הגנה על endpoints של אדמין
- ניהול סשן אוטומטי

### 👥 בחירת שחקנים חכמה
- רשימה קבועה של 16 שחקנים מפורסמים
- בחירה ויזואלית עם אינדיקציה
- ספירה אוטומטית של שחקנים נבחרים

### 🏆 Seeding טורניר מקצועי
- סידור אוטומטי כמו בטורנירים אמיתיים:
  - מקום 1 נגד 16
  - מקום 2 נגד 15
  - מקום 3 נגד 14
  - וכו'...
- הצגת מספר Seed לכל שחקן

### 📊 שלבי טורניר מלאים
- שמינית גמר (R16) - 8 משחקים
- רבע גמר (QF) - 4 משחקים
- **חצי גמר (SF) - 2 משחקים** ✨ חדש!
- גמר (F) - משחק אחד

## 🌐 פריסה ל-Hostinger

1. בנה את הפרוייקט:
```bash
npm run build
```

2. העלה:
   - `client/dist/` → לתיקיית public_html
   - `server/dist/` → לשרת Node.js
   - העתק את `.env` לשרת

3. הגדר משתני סביבה ב-Hostinger:
   - `JWT_SECRET` - מפתח סודי חזק
   - `ADMIN_EMAIL` - אימייל האדמין שלך
   - `ADMIN_PASSWORD` - סיסמה חזקה
   - `CORS_ORIGIN` - כתובת האתר שלך

## 📞 תמיכה

בעיות? פתח issue או צור קשר עם המפתח.

---

נוצר עם ❤️ עבור FC Masters Cup 2025

