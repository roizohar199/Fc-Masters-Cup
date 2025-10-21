# 📧 הוראות הגדרת Gmail לשליחת מיילים

## שלב 1: הפעלת אימות דו-שלבי (2FA)

1. היכנס ל-Google Account שלך: https://myaccount.google.com/security
2. גלול למטה ל-"Signing in to Google"
3. לחץ על "2-Step Verification"
4. עקוב אחרי ההוראות להפעלת אימות דו-שלבי (תצטרך טלפון)

## שלב 2: יצירת App Password

1. אחרי שהפעלת 2FA, היכנס ל: https://myaccount.google.com/apppasswords
2. בחר:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
   - הקלד: "FC Masters Cup"
3. לחץ "Generate"
4. **העתק את הסיסמה בת 16 התווים** (היא תוצג רק פעם אחת!)

## שלב 3: יצירת קובץ .env

צור קובץ בשם `.env` בתיקייה הראשית של הפרויקט עם התוכן הבא:

```env
# הגדרות בסיסיות
PORT=8787
DB_PATH=./server/tournaments.sqlite
TZ=Asia/Jerusalem
NODE_ENV=development

# אבטחה
JWT_SECRET=fc-masters-cup-super-secret-key-2024-change-this-in-production

# פרטי אדמין
ADMIN_EMAIL=fcmasters9@gmail.com
ADMIN_PASSWORD=Admin123456!

# SMTP - שליחת מיילים
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fcmasters9@gmail.com
SMTP_PASS=הכנס-כאן-את-ה-16-תווים-שקיבלת
EMAIL_FROM="FC Masters Cup <fcmasters9@gmail.com>"

# הגדרות אתר
CORS_ORIGIN=http://localhost:5173
SITE_URL=http://localhost:5173
```

**חשוב:** החלף את `הכנס-כאן-את-ה-16-תווים-שקיבלת` בסיסמה שקיבלת בשלב 2!

## שלב 4: בדיקה

אחרי שהגדרת הכל, הרץ את השרת ונסה להירשם עם משתמש חדש.
אתה אמור לקבל מייל למנהל עם פרטי המשתמש החדש.

## ⚠️ שים לב

- הקובץ `.env` לא יועלה ל-Git (הוא ב-.gitignore)
- אל תשתף את הקובץ עם אף אחד
- App Password שונה מהסיסמה הרגילה שלך ב-Gmail
- אם תשנה את סיסמת Gmail שלך, App Password ימשיך לעבוד
- אם תכבה 2FA, תצטרך ליצור App Password חדש

