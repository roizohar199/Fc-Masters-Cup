# תיקון SSH Deploy - מדריך מהיר 🚀

## הבעיה שתוקנה

- ❌ `Permission denied (publickey,password)`
- ❌ `Load key /home/runner/.ssh/id_rsa: error in libcrypto`

## הפתרון - 3 שלבים פשוטים

### 1️⃣ צור מפתח חדש בשרת

התחבר לשרת VPS והרץ:

```bash
ssh-keygen -t ed25519 -C "gha-fcmasters" -f ~/.ssh/gha_ed25519 -N ""
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
```

העתק את המפתח הפרטי:

```bash
cat ~/.ssh/gha_ed25519
```

**העתק הכל** מ-`BEGIN` עד `END` (כולל!)

---

### 2️⃣ הוסף Secrets ב-GitHub

עבור ל: **Repository → Settings → Secrets → Actions**

לחץ **New repository secret** והוסף:

| שם | ערך | דוגמה |
|----|-----|-------|
| `SSH_PRIVATE_KEY` | המפתח שהעתקת | `-----BEGIN OPENSSH...` |
| `SSH_HOST` | IP של השרת | `203.0.113.10` |
| `SSH_USER` | משתמש SSH | `ubuntu` או `root` |
| `SSH_PORT` | פורט (אופציונלי) | `22` |
| `DEPLOY_PATH` | נתיב (אופציונלי) | `/var/www/fcmasters` |

⚠️ **חשוב:** העתק את `SSH_PRIVATE_KEY` **בדיוק כמו שהוא** - ללא שינויים!

---

### 3️⃣ הכן את השרת

```bash
# צור תיקיות
sudo mkdir -p /var/www/fcmasters/releases
sudo chown -R $USER:$USER /var/www/fcmasters

# אמת
ls -la /var/www/fcmasters
```

---

## ✅ זהו! עכשיו תבצע Push

```bash
git add .
git commit -m "fix: SSH deployment with ed25519"
git push origin master
```

עקוב אחרי הדפלוי ב: **Actions** tab

---

## 🔍 בדיקה מהירה (אופציונלי)

מהמחשב המקומי:

```bash
# שמור את המפתח לקובץ זמני
echo "PASTE_PRIVATE_KEY_HERE" > /tmp/test_key
chmod 600 /tmp/test_key

# בדוק חיבור
ssh -i /tmp/test_key user@your-server "echo OK"

# מחק
rm /tmp/test_key
```

אם יצא "OK" - הכל תקין! 🎉

---

## 🆘 משהו לא עובד?

### Permission denied
```bash
# בשרת - בדוק הרשאות
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
ls -la ~/.ssh/
```

### Host key verification failed
זה אמור להיפתר אוטומטית. אם לא:
```bash
ssh-keyscan your-server >> ~/.ssh/known_hosts
```

### rsync לא מותקן
```bash
# Ubuntu/Debian
sudo apt-get install -y rsync
```

---

## 📄 מסמכים נוספים

- [מדריך מפורט באנגלית](./GITHUB-SSH-DEPLOYMENT-SETUP.md)
- [Atomic Deployment Guide](./ATOMIC-DEPLOYMENT-GUIDE.md)

---

**עודכן:** אוקטובר 2025  
**גרסה:** 2.0 - ed25519 + ssh-agent

