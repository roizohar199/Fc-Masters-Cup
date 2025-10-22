# הוראות ליצירת מפתח SSH בשרת VPS

## 📋 קובץ זה להעתקה והדבקה בשרת בלבד

התחבר לשרת ה-VPS שלך והעתק את הפקודות הבאות **אחת אחת**:

---

## 🔑 שלב 1: יצירת מפתח ed25519

```bash
# יצירת מפתח חדש (ללא סיסמה - בשביל CI/CD)
ssh-keygen -t ed25519 -C "gha-fcmasters" -f ~/.ssh/gha_ed25519 -N ""
```

✅ **מה זה עושה:** יוצר זוג מפתחות (פרטי וציבורי) בתיקיה `~/.ssh/`

---

## 🔓 שלב 2: הוספת המפתח הציבורי ל-authorized_keys

```bash
# הוספת המפתח לרשימת מפתחות מורשים
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
```

✅ **מה זה עושה:** מאפשר ל-GitHub Actions להתחבר לשרת עם המפתח שיצרנו

---

## 🔒 שלב 3: הגדרת הרשאות (חובה!)

```bash
# הגדרת הרשאות נכונות לתיקייה ולקבצים
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/gha_ed25519
chmod 644 ~/.ssh/gha_ed25519.pub
```

✅ **למה זה חשוב:** SSH דורש הרשאות מדויקות. אחרת החיבור ייכשל!

---

## 📄 שלב 4: הצגת המפתח הפרטי (להעתקה ל-GitHub)

```bash
# הצג את המפתח הפרטי
cat ~/.ssh/gha_ed25519
```

### 🎯 מה לעשות עכשיו:

1. **העתק הכל** שמוצג על המסך - כולל:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   ...
   -----END OPENSSH PRIVATE KEY-----
   ```

2. לך ל-**GitHub** → Repository → **Settings** → **Secrets and variables** → **Actions**

3. לחץ **New repository secret**

4. הוסף:
   - **Name:** `SSH_PRIVATE_KEY`
   - **Value:** הדבק את כל מה שהעתקת (כמו שהוא!)

---

## 📋 שלב 5: הוספת סודות נוספים ב-GitHub

בדיוק כמו ב-שלב 4, הוסף גם:

### `SSH_HOST`
```bash
# קבל את ה-IP הציבורי של השרת
curl -4 ifconfig.me
```
העתק את ה-IP והוסף אותו כ-`SSH_HOST` ב-GitHub Secrets.

### `SSH_USER`
```bash
# בדוק את שם המשתמש הנוכחי
whoami
```
העתק את השם והוסף אותו כ-`SSH_USER` ב-GitHub Secrets.

### `SSH_PORT` (אופציונלי)
אם אתה משתמש בפורט 22 (ברירת מחדל) - לא צריך להוסיף.
אם השתמשת בפורט אחר:
```bash
# בדוק את הפורט (אם שינית אותו)
sudo grep "^Port" /etc/ssh/sshd_config
```

### `DEPLOY_PATH` (אופציונלי)
אם התיקייה שלך היא `/var/www/fcmasters` - לא צריך להוסיף.
אם זה נתיב אחר - הוסף אותו.

---

## 📁 שלב 6: יצירת תיקיות הדפלוי

```bash
# צור את מבנה התיקיות
sudo mkdir -p /var/www/fcmasters/releases

# תן הרשאות למשתמש שלך
sudo chown -R $USER:$USER /var/www/fcmasters

# אמת שהכל תקין
ls -la /var/www/fcmasters
```

✅ **תוצאה צפויה:**
```
drwxr-xr-x  3 yourusername yourusername 4096 Oct 22 12:00 .
drwxr-xr-x  4 root         root         4096 Oct 22 12:00 ..
drwxr-xr-x  2 yourusername yourusername 4096 Oct 22 12:00 releases
```

---

## ✅ סיימת! עכשיו חזור למחשב שלך

כל הפקודות הבאות במחשב המקומי:

```bash
# הוסף את השינויים
git add .

# עשה commit
git commit -m "fix: SSH deployment with ed25519 key"

# העלה ל-GitHub
git push origin master
```

עקוב אחרי ה-deployment ב-GitHub → **Actions** tab 🚀

---

## 🧪 בדיקה מהירה (אופציונלי)

אם אתה רוצה לבדוק שהמפתח עובד לפני ה-push:

### במחשב המקומי (Windows PowerShell):

```powershell
# שמור את המפתח שהעתקת לקובץ זמני
"YOUR_PRIVATE_KEY_HERE" | Out-File -FilePath $env:TEMP\test_key -Encoding utf8

# בדיקת חיבור (החלף user ו-server)
ssh -i $env:TEMP\test_key -p 22 yourusername@your-server-ip "echo 'Connection successful!'"

# מחק את הקובץ
Remove-Item $env:TEMP\test_key
```

### במחשב מקומי (Linux/Mac):

```bash
# שמור למפתח לקובץ זמני
echo "YOUR_PRIVATE_KEY_HERE" > /tmp/test_key
chmod 600 /tmp/test_key

# בדיקת חיבור
ssh -i /tmp/test_key -p 22 yourusername@your-server-ip "echo 'Connection successful!'"

# מחק
rm /tmp/test_key
```

אם ראית "Connection successful!" - הכל מוכן! ✅

---

## 🔍 פתרון בעיות

### הפקודה `ssh-keygen` לא קיימת

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y openssh-client

# CentOS/RHEL
sudo yum install -y openssh-clients
```

### ה-Directory ~/.ssh לא קיים

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

### Permission denied בעת הוספת ל-authorized_keys

```bash
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
```

---

## 📚 מדריכים נוספים

- [תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md) - מדריך מהיר
- [GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md) - מדריך מפורט

---

**שאלות?** פתח issue או בדוק את ה-logs ב-GitHub Actions.

