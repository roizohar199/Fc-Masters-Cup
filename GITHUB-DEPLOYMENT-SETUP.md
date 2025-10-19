<div dir="rtl" style="text-align: right;">

# 🚀 הדריך להגדרת Deployment אוטומטי מ-GitHub

**תאריך:** אוקטובר 2025  
**זמן הגדרה:** 15-20 דקות

---

## 📋 מה תקבל?

- ✅ **Push to Deploy**: כל push ל-`main` יעשה deployment אוטומטי
- ✅ **בדיקות אוטומטיות**: Build נבדק לפני העלאה
- ✅ **גיבוי אוטומטי**: DB מגובה לפני כל deployment
- ✅ **אתחול אוטומטי**: PM2 מתעדכן וממשיך לרוץ
- ✅ **Rollback קל**: אפשר לחזור לכל commit

---

## 🎯 תהליך העבודה החדש

### לפני (ידני):
```
1. בנה את הפרויקט במחשב
2. פתח WinSCP
3. העלה קבצים אחד אחד
4. התחבר ב-SSH
5. הרץ npm install
6. הפעל מחדש PM2
⏱️ זמן: 10-15 דקות
```

### אחרי (אוטומטי):
```
1. git push
✅ הכל נעשה אוטומטית!
⏱️ זמן: 30 שניות (רק ה-push)
```

---

## 🔧 שלב 1: הכנת SSH Key

### 1.1 יצירת SSH Key במחשב שלך (Windows)

פתח **PowerShell** והרץ:

```powershell
# צור תיקייה ל-SSH אם לא קיימת
mkdir -p $HOME\.ssh
cd $HOME\.ssh

# צור SSH key חדש
ssh-keygen -t rsa -b 4096 -f github_actions_rsa -N '""'
```

זה יוצר 2 קבצים:
- `github_actions_rsa` - **Private Key** (לא לשתף!)
- `github_actions_rsa.pub` - **Public Key** (לשרת)

### 1.2 העתקת Public Key לשרת

**קרא את ה-Public Key:**
```powershell
cat $HOME\.ssh\github_actions_rsa.pub
```

**העתק את כל התוכן** (מתחיל ב-`ssh-rsa ...`)

**התחבר לשרת ב-PuTTY** והרץ:
```bash
# צור תיקיית SSH אם לא קיימת
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# פתח את קובץ ה-authorized_keys
nano ~/.ssh/authorized_keys
```

**הדבק את ה-Public Key** (שורה חדשה בסוף הקובץ)

שמור וצא: `Ctrl+O`, `Enter`, `Ctrl+X`

**הגדר הרשאות:**
```bash
chmod 600 ~/.ssh/authorized_keys
```

### 1.3 בדיקת החיבור

במחשב שלך (PowerShell):
```powershell
# החלף את ה-IP והמשתמש שלך
ssh -i $HOME\.ssh\github_actions_rsa fcmaster@YOUR_VPS_IP

# אם זה עובד ללא סיסמה - מצוין! ✅
```

---

## 🔑 שלב 2: הגדרת GitHub Secrets

### 2.1 קרא את ה-Private Key

במחשב שלך (PowerShell):
```powershell
cat $HOME\.ssh\github_actions_rsa
```

**העתק את כל התוכן** (כולל `-----BEGIN` ו-`-----END`)

### 2.2 הוסף Secrets ב-GitHub

1. **גש לריפו שלך ב-GitHub**:
   ```
   https://github.com/roizohar199/Fc-Masters-Cup
   ```

2. **לחץ על**: `Settings` (בתפריט העליון)

3. **בצד שמאל**: `Secrets and variables` → `Actions`

4. **לחץ**: `New repository secret`

5. **הוסף את ה-Secrets הבאים** (לחץ 4 פעמים על `New repository secret`):

| Name | Value | הסבר |
|------|-------|------|
| `VPS_HOST` | `123.456.789.123` | ה-IP של השרת שלך (מHostinger) |
| `VPS_USER` | `fcmaster` | שם המשתמש (או `root`) |
| `VPS_SSH_KEY` | `[התוכן של github_actions_rsa]` | ה-Private Key **שלם** |
| `VPS_PORT` | `22` | פורט SSH (בד"כ 22) |

**חשוב מאוד:**
- ה-`VPS_SSH_KEY` צריך להכיל את **כל** התוכן של הקובץ
- כולל `-----BEGIN OPENSSH PRIVATE KEY-----`
- כולל `-----END OPENSSH PRIVATE KEY-----`
- כולל כל השורות באמצע

### 2.3 בדיקת Secrets

לאחר ההוספה, תראה רשימה:
```
✅ VPS_HOST
✅ VPS_USER  
✅ VPS_SSH_KEY
✅ VPS_PORT
```

---

## 📁 שלב 3: הכנת הקבצים בשרת

### 3.1 הגדרת התיקייה הנכונה

התחבר לשרת ב-PuTTY:

```bash
# ודא שהתיקייה קיימת
sudo mkdir -p /var/www/fcmasters
sudo chown -R $USER:$USER /var/www/fcmasters

# צור תיקיות משנה
mkdir -p /var/www/fcmasters/server/dist
mkdir -p /var/www/fcmasters/client/dist
mkdir -p /var/www/fcmasters/backups
```

### 3.2 העתקת קובץ .env

**במחשב שלך**, ערוך את `.env.production` ושנה:
```env
SITE_URL=https://YOUR_ACTUAL_DOMAIN.com
CORS_ORIGIN=https://YOUR_ACTUAL_DOMAIN.com
```

**העלה לשרת** (דרך WinSCP או SCP):
```bash
# בשרת:
cd /var/www/fcmasters
nano .env
```

הדבק את התוכן של `.env.production` ושמור.

---

## 🚀 שלב 4: Push ראשון!

### 4.1 הכן את הקוד ל-Git

במחשב שלך (PowerShell בתיקיית הפרויקט):

```powershell
# בדוק מה ישתנה
git status

# הוסף את הקבצים החדשים
git add .github/workflows/deploy.yml
git add .env.production
git add deploy.sh
git add GITHUB-DEPLOYMENT-SETUP.md

# Commit
git commit -m "🚀 Add automatic GitHub deployment"

# Push!
git push origin main
```

### 4.2 צפה ב-Deployment

1. **גש ל-GitHub** → הריפו שלך
2. **לחץ על**: `Actions` (בתפריט העליון)
3. **תראה**: הריצה החדשה של "Deploy to Hostinger VPS"
4. **לחץ עליה** כדי לראות את הלוגים בזמן אמת

אם הכל ירוק ✅ - **מזל טוב! זה עובד!** 🎉

---

## 🎯 שימוש יומיומי

### תהליך עבודה רגיל:

```powershell
# 1. עשה שינויים בקוד
# ... עריכת קבצים ...

# 2. בדוק שהכל עובד מקומית
npm run dev

# 3. Commit ו-Push
git add .
git commit -m "הוספת פיצ'ר חדש"
git push

# 4. GitHub Actions יעשה את השאר! 🚀
```

### צפייה ב-Logs:

- **GitHub**: `Actions` → בחר ריצה → לחץ על Job
- **בשרת**: `pm2 logs fc-masters`

---

## 🔄 Deployment ידני (גיבוי)

אם GitHub Actions לא עובד, אפשר תמיד להריץ ידנית:

### אופציה 1: דרך הסקריפט

```bash
# התחבר לשרת
ssh fcmaster@YOUR_VPS_IP

# הרץ
cd /var/www/fcmasters
chmod +x deploy.sh
./deploy.sh
```

### אופציה 2: צעדים ידניים

```bash
# 1. העלה קבצים (WinSCP או SCP)
# server/dist/ → /var/www/fcmasters/server/dist/
# client/dist/ → /var/www/fcmasters/client/dist/

# 2. בשרת
cd /var/www/fcmasters/server
npm install --production
pm2 restart fc-masters
```

---

## 🧪 טסטים ובדיקות

### בדיקה שהאתר רץ:

```bash
# בשרת
pm2 status
# צריך להיות: fc-masters | online

pm2 logs fc-masters --lines 20
# צריך לראות: "Server started successfully"
```

### בדיקה בדפדפן:

```
https://YOUR_DOMAIN.com
```

אם רואה את האתר - **מעולה!** ✅

---

## ❌ פתרון בעיות

### 🔴 GitHub Actions נכשל

**1. בדוק את הלוגים:**
- GitHub → Actions → בחר את הריצה הכושלת
- לחץ על השלב האדום
- קרא את השגיאה

**2. בעיות נפוצות:**

#### "Permission denied (publickey)"
```bash
# בדוק את ה-SSH Key:
# 1. ודא שה-Public Key בשרת נכון
# 2. ודא שה-Private Key ב-GitHub Secrets שלם
# 3. בדוק הרשאות:
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### "npm install failed"
```bash
# בשרת, מחק node_modules ונסה שוב:
cd /var/www/fcmasters/server
rm -rf node_modules
npm install --production
```

#### "pm2 command not found"
```bash
# התקן PM2 גלובלית:
sudo npm install -g pm2
```

### 🔴 האתר לא מגיב אחרי Deployment

```bash
# בדוק PM2
pm2 status
pm2 logs fc-masters --lines 50

# אם יש שגיאות, הפעל מחדש:
pm2 restart fc-masters

# בדוק את Nginx:
sudo nginx -t
sudo systemctl status nginx
```

### 🔴 שינויים לא מופיעים

```bash
# נקה cache של דפדפן (Ctrl+Shift+R)
# או בדוק שהקבצים עודכנו בשרת:
ls -lah /var/www/fcmasters/client/dist/
```

---

## 🎓 טיפים מתקדמים

### 1. Deploy רק בתנאים מסוימים

ערוך `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ main ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

זה ימנע deployment אם רק עדכנת תיעוד.

### 2. הוסף Slack/Discord notifications

```yaml
- name: Notify Slack
  if: always()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Staging Environment

צור branch `staging` ופרוס ל-VPS נפרד:

```yaml
on:
  push:
    branches: [ staging ]
```

### 4. Rollback מהיר

```bash
# ב-GitHub, לך ל-Actions
# בחר deployment ישן שעבד
# לחץ "Re-run all jobs"
```

---

## 📊 מה קורה מאחורי הקלעים?

כשאתה עושה `git push`:

1. **GitHub מזהה את ה-push**
2. **מריץ את workflow**: `.github/workflows/deploy.yml`
3. **בונה את הקוד**: `npm run build` (server + client)
4. **מעלה לשרת**: דרך SCP את הקבצים המובנים
5. **מתקין dependencies**: `npm install --production`
6. **מפעיל מחדש**: `pm2 restart fc-masters`
7. **מודיע לך**: ✅ או ❌

**כל זה לוקח 2-3 דקות בממוצע.**

---

## 🎉 סיכום

### מה יש לך עכשיו:

- ✅ **CI/CD Pipeline** מלא עם GitHub Actions
- ✅ **Automatic Deployment** - push = deploy
- ✅ **Backup Script** למקרה חירום
- ✅ **SSH Access** מאובטח
- ✅ **Zero Downtime** - PM2 מטפל באתחול

### התהליך החדש שלך:

```
קוד → git push → GitHub Actions → VPS → אתר מעודכן! 🚀
```

**זה הכל! מעכשיו העבודה שלך פשוטה פי 10!** 💪

---

## 📞 צריך עזרה?

אם משהו לא ברור:
1. בדוק את הלוגים: `pm2 logs fc-masters`
2. בדוק GitHub Actions logs
3. נסה Deployment ידני עם `deploy.sh`

**בהצלחה!** 🎊

</div>

