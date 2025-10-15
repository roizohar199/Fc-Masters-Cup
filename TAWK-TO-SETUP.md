# הגדרת Tawk.to לאתר FC Masters Cup

## שלב 1: הרשמה ל-Tawk.to

1. היכנס לאתר [https://www.tawk.to/](https://www.tawk.to/)
2. לחץ על **Sign Up Free** (הרשמה חינמית)
3. מלא את הפרטים:
   - Name (שם)
   - Email (אימייל)
   - Password (סיסמה)
4. אשר את האימייל שלך

## שלב 2: יצירת Property

1. לאחר ההתחברות, לחץ על **Add Property**
2. מלא:
   - **Property Name**: FC Masters Cup
   - **Website URL**: https://your-domain.com (כתובת האתר שלך ב-Hostinger)
3. לחץ **Add Property**

## שלב 3: קבלת Property ID ו-Widget ID

1. לאחר יצירת ה-Property, תועבר לדף הניהול
2. לחץ על **Administration** (ניהול)
3. לחץ על **Channels** -> **Chat Widget**
4. תראה קוד JavaScript שמתחיל ב:
   ```javascript
   var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
   (function(){
   var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
   s1.async=true;
   s1.src='https://embed.tawk.to/PROPERTY_ID/WIDGET_ID';
   ```

5. **העתק** את ה-`PROPERTY_ID` וה-`WIDGET_ID` מהקוד

## שלב 4: הגדרה באתר שלך

עבור לקובץ `client/src/components/TawkTo.tsx` ועדכן:

```typescript
export default function TawkTo({ 
  propertyId = "YOUR_PROPERTY_ID",  // <-- הכנס כאן את ה-Property ID
  widgetId = "default"               // <-- הכנס כאן את ה-Widget ID
}: TawkToProps) {
```

**דוגמה:**
```typescript
export default function TawkTo({ 
  propertyId = "6123456789abcdef12345678",
  widgetId = "1a2b3c4d5e"
}: TawkToProps) {
```

## שלב 5: התאמה אישית (אופציונלי)

### שינוי שפה לעברית
1. ב-Tawk.to Dashboard, עבור ל-**Administration** -> **Chat Widget**
2. בטאב **Appearance**, בחר **Language**: Hebrew
3. שמור שינויים

### התאמת צבעים
1. עבור ל-**Appearance**
2. שנה צבעים כדי להתאים לעיצוב האתר:
   - **Primary Color**: #667eea (סגול)
   - **Widget Position**: Bottom Left / Bottom Right
3. שמור שינויים

### הוספת תגובות אוטומטיות
1. עבור ל-**Automation** -> **Triggers**
2. צור הודעת ברכה אוטומטית:
   ```
   שלום! 👋 
   ברוכים הבאים ל-FC Masters Cup!
   איך אוכל לעזור לך היום?
   ```

### שעות פעילות
1. עבור ל-**Administration** -> **Operating Hours**
2. הגדר את שעות הפעילות שלך
3. הוסף הודעה מחוץ לשעות הפעילות:
   ```
   צוות התמיכה אינו זמין כעת.
   שעות הפעילות: ראשון-חמישי 09:00-18:00
   נחזור אליך בהקדם!
   ```

## שלב 6: בדיקה

1. הפעל את הפרויקט:
   ```bash
   npm run dev
   ```

2. פתח את האתר בדפדפן
3. אמור לראות את הווידג'ט של Tawk.to בפינה השמאלית/ימנית התחתונה
4. לחץ עליו ובדוק שהצ'אט עובד

## שלב 7: גישה לצ'אט מהמובייל

1. הורד את אפליקציית Tawk.to למובייל:
   - [iOS](https://apps.apple.com/app/tawk-to/id612316465)
   - [Android](https://play.google.com/store/apps/details?id=com.tawk.app)

2. התחבר עם אותו חשבון
3. תוכל לענות לצ'אטים מהמובייל בכל מקום!

## פיצ'רים מתקדמים

### 1. הגדרת מידע משתמש אוטומטי
עדכן ב-`TawkTo.tsx`:
```typescript
(window as any).Tawk_API.onLoad = function() {
  // אם יש משתמש מחובר, העבר את הפרטים
  if (userEmail) {
    (window as any).Tawk_API.setAttributes({
      'name': userEmail,
      'email': userEmail,
      'hash': 'visitor-hash' // לאבטחה מתקדמת
    });
  }
};
```

### 2. הסתרת צ'אט במקומות מסוימים
```typescript
// בדף מנהל, אל תציג את Tawk.to
{!isAdmin && <TawkTo />}
```

### 3. אינטגרציה עם Google Analytics
1. ב-Tawk.to Dashboard: **Integrations** -> **Google Analytics**
2. הכנס את ה-Tracking ID שלך
3. כעת תראה סטטיסטיקות צ'אט ב-Analytics

## תמחור

- **Free Plan** (חינמי לתמיד):
  - צ'אט חי ללא הגבלה
  - מספר לא מוגבל של אגנטים
  - אפליקציות מובייל
  - היסטוריה לא מוגבלת

- **Premium Plans** (תשלום):
  - הסרת מיתוג Tawk.to
  - וידאו צ'אט
  - שיתוף מסך
  - עדיפות בתמיכה

**למרבית המקרים, התוכנית החינמית מספקת!** ✅

## תמיכה

- **מרכז עזרה**: https://help.tawk.to/
- **מדריכים**: https://www.tawk.to/knowledgebase/
- **צ'אט תמיכה**: זמין באתר Tawk.to

---

**בהצלחה! 🎉**

אם יש בעיות, פנה לתמיכה של Tawk.to - הם מאוד מהירים ומועילים.

