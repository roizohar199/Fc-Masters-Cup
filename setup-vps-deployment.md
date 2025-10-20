# 🚀 הגדרת Deployment אוטומטי לשרת

## 📋 מה צריך לעשות?

יצרתי לך GitHub Actions שיעשה deployment אוטומטי אחרי כל `git push`.

---

## 🔑 שלב 1: יצירת SSH Key

### במחשב שלך (PowerShell):

```powershell
# צור SSH key חדש
ssh-keygen -t rsa -b 4096 -f "$HOME\.ssh\github_deploy" -N '""'

# הצג את ה-Public Key
Get-Content "$HOME\.ssh\github_deploy.pub"
```

**העתק את כל התוכן** (מתחיל ב-`ssh-rsa`)

---

## 🖥️ שלב 2: הוסף את ה-Key לשרת

### התחבר לשרת (PuTTY או SSH):

```bash
# צור תיקיית SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# פתח את קובץ authorized_keys
nano ~/.ssh/authorized_keys
```

**הדבק את ה-Public Key** שהעתקת (שורה חדשה בסוף)

**שמור:** `Ctrl+O`, `Enter`, `Ctrl+X`

**הגדר הרשאות:**
```bash
chmod 600 ~/.ssh/authorized_keys
```

---

## 🔐 שלב 3: הוסף Secrets ב-GitHub

1. **גש ל-GitHub:**
   ```
   https://github.com/roizohar199/Fc-Masters-Cup/settings/secrets/actions
   ```

2. **לחץ:** `New repository secret`

3. **הוסף 4 Secrets:**

### Secret 1: VPS_HOST
```
Name: VPS_HOST
Value: [ה-IP של השרת שלך]
```

### Secret 2: VPS_USER
```
Name: VPS_USER
Value: fcmaster
```
(או שם המשתמש שלך בשרת)

### Secret 3: VPS_SSH_KEY
```
Name: VPS_SSH_KEY
Value: [תוכן הקובץ github_deploy]
```

**איך לקבל את התוכן?**
```powershell
# במחשב שלך:
Get-Content "$HOME\.ssh\github_deploy"
```

**העתק את הכל** (כולל `-----BEGIN` ו-`-----END`)

### Secret 4: VPS_PORT
```
Name: VPS_PORT
Value: 22
```

---

## ✅ שלב 4: ודא שהתיקייה בשרת קיימת

### בשרת (SSH):

```bash
# צור תיקייה
sudo mkdir -p /var/www/fcmasters
sudo chown -R $USER:$USER /var/www/fcmasters

# צור תיקיות משנה
mkdir -p /var/www/fcmasters/server/dist
mkdir -p /var/www/fcmasters/client/dist
mkdir -p /var/www/fcmasters/backups
```

---

## 🎯 שלב 5: Push ראשון!

### במחשב שלך:

```powershell
cd "C:\FC Masters Cup"

git add .github/workflows/deploy.yml
git commit -m "🚀 Add automatic deployment"
git push origin master
```

---

## 📊 בדיקה שזה עובד

### 1. בדוק ב-GitHub Actions:
```
https://github.com/roizohar199/Fc-Masters-Cup/actions
```

תראה את ה-deployment רץ בזמן אמת!

### 2. בדוק בשרת:
```bash
pm2 status
pm2 logs fc-masters
```

### 3. בדוק בדפדפן:
```
https://www.k-rstudio.com
```

---

## 🔄 מעכשיו - תהליך העבודה

```powershell
# 1. עשה שינויים בקוד
# 2. Commit
git add .
git commit -m "עדכון חדש"

# 3. Push - והכל יעשה אוטומטית!
git push origin master

# 4. GitHub Actions יבנה ויעלה לשרת! 🚀
```

---

## ❌ פתרון בעיות

### GitHub Actions נכשל?

**בדוק:**
1. 4 ה-Secrets נוספו ב-GitHub
2. ה-SSH Key הועתק נכון (כולל BEGIN/END)
3. השרת זמין וה-IP נכון

### האתר לא מתעדכן?

```bash
# בשרת:
pm2 restart fc-masters
pm2 logs fc-masters

# נקה cache בדפדפן:
Ctrl+Shift+R
```

---

## 🎉 סיכום

### מה יקרה אחרי כל `git push`:

1. ✅ GitHub Actions מזהה את ה-push
2. ✅ בונה את הקוד (server + client)
3. ✅ מעלה לשרת דרך SCP
4. ✅ מתקין dependencies
5. ✅ מפעיל מחדש PM2
6. ✅ האתר מתעדכן!

**זמן: 2-3 דקות בממוצע**

---

## 📞 צריך עזרה?

אם משהו לא עובד:
1. בדוק לוגים: `pm2 logs fc-masters`
2. בדוק GitHub Actions logs
3. נסה deployment ידני עם `deploy.sh`

**בהצלחה!** 🚀

