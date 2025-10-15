# הגדרת Google OAuth

## שלבים להפעלת Google OAuth

### 1. יצירת פרויקט ב-Google Cloud Console

1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט חדש או בחר פרויקט קיים
3. עבור ל-**APIs & Services** > **Credentials**
4. לחץ על **Create Credentials** > **OAuth 2.0 Client ID**

### 2. הגדרת OAuth Consent Screen

1. עבור ל-**OAuth consent screen**
2. בחר **External** (או Internal אם יש לך Google Workspace)
3. מלא את הפרטים הבסיסיים:
   - שם האפליקציה: **FC Masters Cup**
   - מייל תמיכה
   - לוגו (אופציונלי)
4. הוסף scopes: `email` ו-`profile`
5. שמור והמשך

### 3. יצירת OAuth Client ID

1. חזור ל-**Credentials**
2. צור **OAuth 2.0 Client ID**
3. בחר **Web application**
4. הוסף Authorized redirect URIs:
   - פיתוח: `http://localhost:8787/api/auth/google/callback`
   - פרודקשן: `https://your-domain.com/api/auth/google/callback`
5. שמור ותקבל את ה-**Client ID** ו-**Client Secret**

### 4. עדכון משתני סביבה

הוסף לקובץ `.env` בתיקיית `server/`:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:8787/api/auth/google/callback
```

לפרודקשן, עדכן את `GOOGLE_CALLBACK_URL` לכתובת האמיתית שלך:
```env
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

### 5. הפעלה מחדש של השרת

לאחר עדכון משתני הסביבה, הפעל מחדש את השרת:

```bash
cd server
npm run dev
```

## בדיקה

1. היכנס לדף ההתחברות
2. לחץ על "התחבר באמצעות Google"
3. תעבור לדף ההזדהות של Google
4. לאחר אישור, תועבר חזרה לאפליקציה מחובר

## הערות חשובות

- ללא הגדרת `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET`, האפליקציה תמשיך לעבוד אבל **ללא** תמיכה ב-Google OAuth
- ב-localhost ייתכן שתצטרך להוסיף את `http://localhost:8787` גם ל-Authorized JavaScript origins
- בפרודקשן, וודא ש-HTTPS מופעל (Google דורש HTTPS לכל ה-domains מלבד localhost)

## תמיכה

אם נתקלת בבעיות:
1. בדוק שה-Redirect URI תואם בדיוק למה שהגדרת ב-Google Console
2. וודא שה-OAuth Consent Screen מאושר
3. בדוק את הלוגים של השרת לשגיאות

