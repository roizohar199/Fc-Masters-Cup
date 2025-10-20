# תיקון בעיית WebSocket בפרודקשן

## הבעיה
בפרודקשן, החיבור ל-WebSocket נכשל (שגיאה 1006) כי הקוד ניסה להתחבר לפורט 8787, אבל Nginx מאזין על 443 ומבצע proxy פנימה.

## הפתרון
יצרתי מערכת דינמית ליצירת URL נכון ל-WebSocket:

### 1. קובץ עזר חדש: `client/src/utils/ws.ts`
```typescript
export function getPresenceWsUrl(): string {
  const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

  // תמיכה במשתני סביבה
  if (isProd && import.meta.env.VITE_WS_URL_PROD) {
    return import.meta.env.VITE_WS_URL_PROD;
  }
  
  if (!isProd && import.meta.env.VITE_WS_URL_DEV) {
    return import.meta.env.VITE_WS_URL_DEV;
  }

  // fallback ללוגיקה אוטומטית
  if (isProd) {
    return `wss://${location.host}/presence`;  // פרודקשן: ללא פורט!
  }

  return `ws://localhost:8787/presence`;  // פיתוח: פורט 8787
}
```

### 2. עדכון מערכת הנוכחות
עדכנתי את `client/src/presence.ts` להשתמש בפונקציה החדשה במקום כתובות קשיחות.

## איך זה עובד

### בפיתוח (localhost):
- משתמש ב-`ws://localhost:8787/presence`
- השרת מאזין ישירות על פורט 8787

### בפרודקשן:
- משתמש ב-`wss://www.k-rstudio.com/presence` (ללא פורט!)
- Nginx על 443 מבצע proxy ל-8787
- SSL/TLS מופעל אוטומטית

## תמיכה במשתני סביבה (אופציונלי)
אפשר להגדיר משתני סביבה ב-`.env` של הקליינט:
```env
VITE_WS_URL_PROD=wss://www.k-rstudio.com/presence
VITE_WS_URL_DEV=ws://localhost:8787/presence
```

## בדיקה
1. **בפיתוח**: פתח את הקונסול בדפדפן ותראה: `🔌 Connecting to WebSocket: ws://localhost:8787/presence`
2. **בפרודקשן**: תראה: `🔌 Connecting to WebSocket: wss://www.k-rstudio.com/presence`

## מה תוקן
- ✅ הסרתי כתובות WebSocket קשיחות
- ✅ יצרתי מערכת דינמית ליצירת URLs
- ✅ תמיכה בפרודקשן ופיתוח
- ✅ תמיכה במשתני סביבה
- ✅ הודעות debug ברורות

עכשיו החיבור ל-WebSocket אמור לעבוד גם בפרודקשן!
