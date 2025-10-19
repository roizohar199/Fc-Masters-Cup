# 🚀 התחלה מהירה - GitHub Deployment

**זמן הקמה: 10 דקות** ⏱️

---

## שלבים מהירים

### 1️⃣ הרץ את סקריפט ההגדרה (Windows)

```powershell
.\setup-github-deployment.ps1
```

הסקריפט יעזור לך:
- ✅ ליצור SSH Keys
- ✅ להציג את המפתחות להעתקה
- ✅ לבדוק חיבור
- ✅ ליצור .env.production

---

### 2️⃣ הוסף Secrets ב-GitHub

גש ל: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

הוסף 4 secrets:

| Name | Value |
|------|-------|
| `VPS_HOST` | ה-IP של השרת |
| `VPS_USER` | `fcmaster` |
| `VPS_SSH_KEY` | ה-Private Key המלא |
| `VPS_PORT` | `22` |

---

### 3️⃣ ערוך .env.production

```powershell
notepad .env.production
```

שנה:
```env
SITE_URL=https://YOUR-DOMAIN.com
CORS_ORIGIN=https://YOUR-DOMAIN.com
ADMIN_EMAIL=your-email@gmail.com
# ... שאר הפרטים שלך
```

---

### 4️⃣ העלה .env לשרת

**בPuTTY (השרת):**
```bash
cd /var/www/fcmasters
nano .env
```

הדבק את תוכן .env.production ושמור.

---

### 5️⃣ Push והכל יעבוד!

```powershell
git add .
git commit -m "🚀 Setup automatic deployment"
git push origin main
```

**צפה ב-deployment:**
- GitHub → Actions → Deploy to Hostinger VPS

---

## ✅ זהו! עכשיו כל push יעשה deployment אוטומטי!

---

## שאלות נפוצות

### ❓ איך אני רואה את הלוגים?
**GitHub:** `Actions` → בחר ריצה  
**בשרת:** `pm2 logs fc-masters`

### ❓ איך אני עושה rollback?
**GitHub:** `Actions` → בחר deployment ישן → `Re-run all jobs`

### ❓ איך אני עושר deployment ידני?
```bash
ssh YOUR_USER@YOUR_VPS_IP
cd /var/www/fcmasters
./deploy.sh
```

---

## 📖 מידע נוסף

קרא את **GITHUB-DEPLOYMENT-SETUP.md** למדריך מפורט.

---

**בהצלחה!** 🎉

