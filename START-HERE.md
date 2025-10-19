<div dir="rtl" style="text-align: right;">

# 🎯 התחל כאן - הגדרת Deployment אוטומטי

**זמן: 10 דקות** | **GitHub Repository:** https://github.com/roizohar199/Fc-Masters-Cup

---

## ✅ שלב 1: הרץ את הסקריפט

פתח **PowerShell** בתיקיית הפרויקט והרץ:

```powershell
npm run deploy:setup
```

או ישירות:

```powershell
.\setup-github-deployment.ps1
```

---

## 📝 מה הסקריפט יעשה?

הסקריפט ידריך אותך דרך:

### 1️⃣ יצירת SSH Keys (אוטומטי)
- ✅ יוצר מפתח ב: `C:\Users\YourName\.ssh\github_actions_rsa`
- ✅ מציג את ה-Public Key להעתקה

### 2️⃣ הוספת Public Key לשרת (ידני)
הסקריפט יציג לך את ה-Public Key ויבקש ממך:
1. להתחבר לשרת ב-PuTTY
2. להריץ פקודות
3. להדביק את המפתח

### 3️⃣ הצגת Private Key ל-GitHub (ידני)
הסקריפט יציג את ה-Private Key ויבקש ממך:
1. לגשת ל-GitHub Secrets
2. להוסיף 4 secrets

### 4️⃣ בדיקת חיבור (אוטומטי)
הסקריפט יבדוק שה-SSH עובד.

### 5️⃣ יצירת .env.production (אוטומטי)
הסקריפט יוצר את הקובץ מהדוגמה.

---

## 🔑 GitHub Secrets שתצטרך להוסיף

גש ל:
```
https://github.com/roizohar199/Fc-Masters-Cup/settings/secrets/actions
```

הוסף 4 Secrets (הסקריפט יציג את הערכים):

| Name | Value | מאיפה? |
|------|-------|--------|
| `VPS_HOST` | ה-IP של השרת שלך | מHostinger |
| `VPS_USER` | `fcmaster` או `root` | שם המשתמש שלך |
| `VPS_SSH_KEY` | [המפתח הפרטי] | הסקריפט יציג |
| `VPS_PORT` | `22` | פורט SSH |

---

## 📋 לפני שמתחילים - ודא שיש לך:

- [ ] **גישה לשרת** - אתה יכול להתחבר דרך PuTTY
- [ ] **פרטי השרת**:
  - IP Address של השרת
  - שם משתמש (fcmaster או root)
  - סיסמה
- [ ] **גישה ל-GitHub** - יכולת לערוך את ה-repository
- [ ] **PuTTY מותקן** - [הורד כאן](https://www.putty.org/) אם אין לך

---

## 🚀 מוכן? התחל עכשיו!

```powershell
# וודא שאתה בתיקיית הפרויקט
cd "C:\FC Masters Cup"

# הרץ את הסקריפט
npm run deploy:setup
```

---

## 🎬 מה יקרה אחרי ההגדרה?

אחרי שתסיים את כל השלבים, פשוט:

```powershell
git add .
git commit -m "🚀 Setup automatic deployment"
git push origin master
```

**ותראה את ה-deployment רץ אוטומטית ב:**
```
https://github.com/roizohar199/Fc-Masters-Cup/actions
```

---

## ❓ שאלות נפוצות

### שאלה: מה אם אין לי VPS עדיין?
**תשובה:** קרא את [מדריך-העלאה-ל-Hostinger-VPS.md](מדריך-העלאה-ל-Hostinger-VPS.md) קודם.

### שאלה: מה אם הסקריפט נכשל?
**תשובה:** פעל לפי ה-Checklist הידני: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

### שאלה: איך אני יודע שזה עבד?
**תשובה:** 
1. גש ל: https://github.com/roizohar199/Fc-Masters-Cup/actions
2. תראה "Deploy to Hostinger VPS" ירוק ✅

---

## 🆘 צריך עזרה?

- **מדריך מהיר:** [QUICK-START-DEPLOYMENT.md](QUICK-START-DEPLOYMENT.md)
- **מדריך מפורט:** [GITHUB-DEPLOYMENT-SETUP.md](GITHUB-DEPLOYMENT-SETUP.md)
- **Checklist ידני:** [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

---

## ✨ בהצלחה!

**עכשיו לך והרץ את הסקריפט - זה יעזור לך בכל שלב!** 💪

```powershell
npm run deploy:setup
```

</div>

