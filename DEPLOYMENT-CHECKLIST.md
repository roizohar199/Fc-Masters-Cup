<div dir="rtl" style="text-align: right;">

# ✅ Checklist - הגדרת GitHub Deployment

**הדפס או סמן בזמן העבודה!**

---

## 📋 לפני שמתחילים

- [ ] יש לך **GitHub Repository** לפרויקט
- [ ] יש לך **VPS** (Hostinger או אחר) עם SSH access
- [ ] יש לך **ה-IP של השרת**
- [ ] יש לך **שם משתמש** לשרת (fcmaster או root)
- [ ] התקנת **PuTTY** להתחברות לשרת
- [ ] התקנת **Git** במחשב

---

## 🔑 שלב 1: SSH Keys (5 דקות)

### במחשב שלך (Windows):

- [ ] פתח **PowerShell**
- [ ] הרץ:
  ```powershell
  npm run deploy:setup
  ```
  או:
  ```powershell
  .\setup-github-deployment.ps1
  ```

### או ידנית:

- [ ] צור SSH Key:
  ```powershell
  ssh-keygen -t rsa -b 4096 -f $HOME\.ssh\github_actions_rsa -N '""'
  ```
- [ ] קרא Public Key:
  ```powershell
  cat $HOME\.ssh\github_actions_rsa.pub
  ```
- [ ] **העתק את התוכן**

### בשרת (PuTTY):

- [ ] התחבר לשרת
- [ ] הרץ:
  ```bash
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  nano ~/.ssh/authorized_keys
  ```
- [ ] **הדבק את ה-Public Key**
- [ ] שמור: `Ctrl+O`, `Enter`, `Ctrl+X`
- [ ] הרץ:
  ```bash
  chmod 600 ~/.ssh/authorized_keys
  ```

### בדיקה:

- [ ] במחשב שלך:
  ```powershell
  ssh -i $HOME\.ssh\github_actions_rsa YOUR_USER@YOUR_VPS_IP
  ```
- [ ] **צריך להתחבר ללא סיסמה!** ✅

---

## 🔐 שלב 2: GitHub Secrets (3 דקות)

### קרא Private Key:

- [ ] במחשב:
  ```powershell
  cat $HOME\.ssh\github_actions_rsa
  ```
- [ ] **העתק את כל התוכן** (כולל BEGIN/END)

### הוסף ל-GitHub:

- [ ] גש ל: `https://github.com/roizohar199/Fc-Masters-Cup/settings/secrets/actions`
- [ ] לחץ: **New repository secret**

הוסף 4 Secrets:

#### Secret 1:
- [ ] Name: `VPS_HOST`
- [ ] Value: `123.456.789.123` (ה-IP שלך)
- [ ] לחץ: **Add secret**

#### Secret 2:
- [ ] Name: `VPS_USER`
- [ ] Value: `fcmaster` (או המשתמש שלך)
- [ ] לחץ: **Add secret**

#### Secret 3:
- [ ] Name: `VPS_SSH_KEY`
- [ ] Value: [הדבק את כל ה-Private Key]
- [ ] לחץ: **Add secret**

#### Secret 4:
- [ ] Name: `VPS_PORT`
- [ ] Value: `22`
- [ ] לחץ: **Add secret**

### בדיקה:

- [ ] יש לך **4 secrets** ברשימה ✅

---

## 📁 שלב 3: .env.production (2 דקות)

### במחשב שלך:

- [ ] העתק:
  ```powershell
  copy .env.production.example .env.production
  ```
- [ ] פתח:
  ```powershell
  notepad .env.production
  ```

### ערוך את הערכים:

- [ ] `SITE_URL=https://YOUR-DOMAIN.com`
- [ ] `CORS_ORIGIN=https://YOUR-DOMAIN.com`
- [ ] `ADMIN_EMAIL=your-email@gmail.com`
- [ ] `ADMIN_PASSWORD=YourSecurePassword`
- [ ] `SMTP_USER=your-email@gmail.com`
- [ ] `SMTP_PASS=your-app-password`
- [ ] **שמור את הקובץ**

### העלה לשרת:

#### אפשרות 1: WinSCP
- [ ] התחבר לשרת עם WinSCP
- [ ] העלה `.env.production` ל: `/var/www/fcmasters/.env`

#### אפשרות 2: ידני בPuTTY
- [ ] בשרת:
  ```bash
  cd /var/www/fcmasters
  nano .env
  ```
- [ ] הדבק את תוכן `.env.production`
- [ ] שמור: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 📂 שלב 4: תיקיות בשרת (2 דקות)

### בPuTTY (שרת):

- [ ] הרץ:
  ```bash
  sudo mkdir -p /var/www/fcmasters
  sudo chown -R $USER:$USER /var/www/fcmasters
  mkdir -p /var/www/fcmasters/server/dist
  mkdir -p /var/www/fcmasters/client/dist
  mkdir -p /var/www/fcmasters/backups
  ```

### העתק deploy.sh לשרת:

- [ ] במחשב, דרך WinSCP:
  - העלה `deploy.sh` ל: `/var/www/fcmasters/deploy.sh`

- [ ] בשרת (PuTTY):
  ```bash
  cd /var/www/fcmasters
  chmod +x deploy.sh
  ```

---

## 🚀 שלב 5: First Deployment! (2 דקות)

### במחשב שלך:

- [ ] בדוק שהכל עובד מקומית:
  ```powershell
  npm run build
  ```
  **צריך להצליח ללא שגיאות!** ✅

### Push ל-GitHub:

- [ ] בדוק מה ישתנה:
  ```powershell
  git status
  ```

- [ ] הוסף את הכל:
  ```powershell
  git add .
  ```

- [ ] Commit:
  ```powershell
  git commit -m "🚀 Setup automatic GitHub deployment"
  ```

- [ ] Push:
  ```powershell
  git push origin main
  ```

---

## 🎯 שלב 6: צפה ב-Deployment (3 דקות)

### ב-GitHub:

- [ ] גש ל: `https://github.com/roizohar199/Fc-Masters-Cup`
- [ ] לחץ על: **Actions** (בתפריט העליון)
- [ ] תראה: **Deploy to Hostinger VPS** (רץ עכשיו)
- [ ] **לחץ עליו** לראות לוגים

### המתן עד שזה מסתיים:

- [ ] כל השלבים **ירוקים** ✅
- [ ] לוקח בערך **2-3 דקות**

### אם יש שגיאה:

- [ ] לחץ על השלב האדום
- [ ] קרא את השגיאה
- [ ] תקן ועשה push שוב

---

## ✅ שלב 7: בדיקה (2 דקות)

### בדוק בשרת:

- [ ] בPuTTY:
  ```bash
  pm2 status
  ```
- [ ] צריך להיות: **fc-masters | online** ✅

- [ ] ראה לוגים:
  ```bash
  pm2 logs fc-masters --lines 20
  ```
- [ ] צריך להיות: **"Server started successfully"** ✅

### בדוק בדפדפן:

- [ ] גש ל: `https://YOUR-DOMAIN.com`
- [ ] **האתר אמור לעבוד!** ✅

---

## 🎉 סיימת! מה עכשיו?

### תהליך עבודה יומיומי:

```powershell
# עשה שינויים בקוד
# ...

# בדוק מקומית
npm run dev

# הכל עובד? Push!
git add .
git commit -m "תיאור השינוי"
git push

# GitHub Actions יעשה את השאר! 🚀
```

---

## 🔧 פקודות שימושיות

### במחשב שלך:

```powershell
# בנה את הפרויקט
npm run build

# בדוק build
npm run build:check

# הרץ מקומית
npm run dev
```

### בשרת (PuTTY):

```bash
# סטטוס PM2
pm2 status

# לוגים
pm2 logs fc-masters

# אתחול
pm2 restart fc-masters

# Deployment ידני
cd /var/www/fcmasters
./deploy.sh

# בדוק Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 📊 פתרון בעיות מהיר

### 🔴 GitHub Actions נכשל

- [ ] בדוק את הלוגים ב-Actions
- [ ] בדוק ש-4 ה-Secrets קיימים
- [ ] בדוק את ה-SSH connection ידנית

### 🔴 PM2 לא רץ

```bash
cd /var/www/fcmasters/server
npm install --production
pm2 start dist/index.js --name fc-masters
pm2 save
```

### 🔴 האתר לא מגיב

```bash
# בדוק Nginx
sudo nginx -t
sudo systemctl restart nginx

# בדוק PM2
pm2 restart fc-masters
pm2 logs fc-masters
```

---

## 📚 קבצי עזר

- **מדריך מהיר**: [QUICK-START-DEPLOYMENT.md](QUICK-START-DEPLOYMENT.md)
- **מדריך מפורט**: [GITHUB-DEPLOYMENT-SETUP.md](GITHUB-DEPLOYMENT-SETUP.md)
- **סיכום**: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)

---

## ✨ Checklist סיים!

אם סימנת הכל - **מזל טוב!** 🎊

**יש לך עכשיו deployment אוטומטי מלא!** 🚀

</div>

