# 🗂️ אינדקס תיקון SSH Deployment

## 🚀 התחלה מהירה - לאן ללכת?

### 📍 אני רוצה להתחיל **עכשיו** - איזה קובץ לקרוא?

👉 **[תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md)** ← **התחל כאן!** (3 שלבים פשוטים)

---

## 📚 כל המדריכים לפי סדר מומלץ

### 1️⃣ משתמש חדש - אין לי deployment

| קובץ | למה? | זמן קריאה |
|------|------|-----------|
| **[תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md)** | התחלה מהירה - 3 שלבים | 5 דקות |
| **[הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md)** | פקודות להעתקה בשרת | 10 דקות |
| **[הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)** | ⭐ **איך להוסיף Secrets ב-GitHub** | 7 דקות |
| **[GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md)** | מדריך מפורט עם פתרון בעיות | 20 דקות |

---

### 2️⃣ יש לי deployment עובד - אבל יש שגיאות SSH

| קובץ | למה? | זמן קריאה |
|------|------|-----------|
| **[MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md)** | מעבר בטוח ממפתחות ישנים | 15 דקות |
| **[תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md)** | שלבי התיקון | 5 דקות |

---

### 3️⃣ אני רוצה להבין מה בדיוק תוקן

| קובץ | למה? | זמן קריאה |
|------|------|-----------|
| **[SUMMARY-SSH-DEPLOYMENT-FIX.md](./SUMMARY-SSH-DEPLOYMENT-FIX.md)** | סיכום מקיף של כל השינויים | 10 דקות |

---

## 🎯 מדריכים לפי נושא

### 🔧 הגדרה ראשונית
- **[תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md)** - מדריך מהיר (עברית)
- **[הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md)** - פקודות לשרת VPS
- **[הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)** - ⭐ **הוספת Secrets ב-GitHub**
- **[GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md)** - מדריך מפורט (אנגלית)

### 🔄 מיגרציה
- **[MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md)** - מעבר בטוח ממפתחות RSA ל-ed25519

### 📊 הבנה וסיכום
- **[SUMMARY-SSH-DEPLOYMENT-FIX.md](./SUMMARY-SSH-DEPLOYMENT-FIX.md)** - סיכום מקיף
- **[SSH-DEPLOYMENT-INDEX.md](./SSH-DEPLOYMENT-INDEX.md)** - זה! (אינדקס)

---

## 🔍 איזה קובץ לאיזו בעיה?

| הבעיה שלי | הקובץ שיעזור |
|-----------|--------------|
| ❌ **ssh-private-key argument is empty** | ⭐ **[הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)** |
| ❌ Missing SSH_PRIVATE_KEY | ⭐ **[הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)** |
| ❌ Permission denied (publickey) | [תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md) |
| ❌ Load key: error in libcrypto | [GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md) |
| ❌ Host key verification failed | [GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md) + סעיף פתרון בעיות |
| 🔄 רוצה לעדכן ממפתחות ישנים | [MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md) |
| 🆕 אין לי deployment בכלל | [תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md) → [הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md) |
| 📚 רוצה להבין מה קורה | [SUMMARY-SSH-DEPLOYMENT-FIX.md](./SUMMARY-SSH-DEPLOYMENT-FIX.md) |
| 🧪 רוצה לבדוק לפני push | [MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md) + סעיף בדיקה |
| 🔙 משהו השתבש - איך rollback? | [MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md) + סעיף Rollback |

---

## 📖 סדר קריאה מומלץ למתחילים

```
1. תיקון-SSH-Deploy.md                    (5 דקות)
   ↓
2. הוראות-SSH-Key-Setup.md                (10 דקות - תוך כדי הרצה בשרת)
   ↓
3. בצע git push ובדוק Actions
   ↓
4. אם עובד ✅ → סיימת!
5. אם לא עובד ❌ → GITHUB-SSH-DEPLOYMENT-SETUP.md (סעיף פתרון בעיות)
```

---

## 📖 סדר קריאה למשתמשים מתקדמים (יש deployment קיים)

```
1. MIGRATION-SSH-KEYS.md                  (15 דקות)
   ↓
2. הוראות-SSH-Key-Setup.md                (10 דקות)
   ↓
3. בדיקה מקומית (MIGRATION-SSH-KEYS.md → סעיף בדיקה)
   ↓
4. עדכון GitHub Secrets
   ↓
5. git push ובדיקה
   ↓
6. אם עובד ✅ → ניקוי מפתחות ישנים
7. אם לא עובד ❌ → MIGRATION-SSH-KEYS.md (סעיף Rollback)
```

---

## ⚡ TL;DR (קיצור קיצורים)

### לא יודע כלום על SSH? יש לי בעיה בדפלוי?
👉 **[תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md)** ← רק את זה תקרא

### יודע מה אני עושה, רוצה פרטים?
👉 **[GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md)** ← מדריך מפורט

### יש לי deployment עובד, רוצה לעדכן?
👉 **[MIGRATION-SSH-KEYS.md](./MIGRATION-SSH-KEYS.md)** ← מיגרציה בטוחה

### רוצה לדעת מה בכלל השתנה?
👉 **[SUMMARY-SSH-DEPLOYMENT-FIX.md](./SUMMARY-SSH-DEPLOYMENT-FIX.md)** ← סיכום

---

## 🆘 תמיכה

1. **קרא את הקובץ המתאים** (ראה טבלה למעלה)
2. **בדוק logs ב-GitHub Actions** → Actions tab → Run → Failed step
3. **בדוק logs בשרת** - `sudo tail -f /var/log/auth.log`
4. **פתח issue** עם:
   - ✅ הודעת שגיאה מלאה
   - ✅ איזה מדריך עקבת
   - ✅ מה ניסית כבר

---

## 🎓 רקע טכני

אם אתה רוצה להבין את הרקע הטכני מאחורי התיקון:

- **למה ed25519?** - [Wikipedia: EdDSA](https://en.wikipedia.org/wiki/EdDSA)
- **למה ssh-agent?** - [SSH Agent Forwarding](https://www.ssh.com/academy/ssh/agent)
- **דפלוי אטומי?** - [Capistrano-style deployment](https://capistranorb.com/documentation/getting-started/structure/)

---

## ✅ Checklist מהיר

לפני שמתחילים - **יש לך**:

- [ ] גישה לשרת VPS (SSH/Console)
- [ ] גישת Admin ל-GitHub repository
- [ ] 30 דקות זמן פנוי
- [ ] גיבוי של קוד ו-.env (תמיד!)

---

**עודכן:** אוקטובר 2025  
**גרסה:** 1.0  
**קבצים:** 5 מדריכים + workflow מעודכן  
**סטטוס:** ✅ מוכן לשימוש

