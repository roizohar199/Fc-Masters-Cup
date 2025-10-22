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

> 📖 **מדריך מפורט עם צעד-אחר-צעד:** [הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)

עבור ל: **Repository → Settings → Secrets and variables → Actions**

לחץ **New repository secret** והוסף **בדיוק בסדר הזה**:

#### **סוד #1: SSH_PRIVATE_KEY** (חובה!)
```
Name:  SSH_PRIVATE_KEY
Value: [הדבק את כל תוכן המפתח מ-cat ~/.ssh/gha_ed25519]
```

**⚠️ חשוב מאוד:**
- ✅ העתק **הכל** - מ-`-----BEGIN` עד `-----END` (כולל!)
- ✅ השאר את המבנה בדיוק כמו שהוא (כל השורות)
- ❌ **אל** תקודד לBase64
- ❌ **אל** תוסיף רווחים או תווים נוספים
- ❌ **אל** תשנה את סוף השורות (CRLF/LF)

#### **סוד #2: SSH_HOST** (חובה!)
```
Name:  SSH_HOST
Value: [IP של השרת, לדוגמה: 203.0.113.10]
```

#### **סוד #3: SSH_USER** (חובה!)
```
Name:  SSH_USER
Value: [שם המשתמש, לדוגמה: ubuntu]
```

#### סודות אופציונליים (רק אם שונה מברירת מחדל):
```
Name:  SSH_PORT
Value: 22  (רק אם אתה משתמש בפורט אחר!)

Name:  DEPLOY_PATH
Value: /var/www/fcmasters  (רק אם הנתיב שלך שונה!)
```

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

### ssh-private-key argument is empty
זו הבעיה הכי נפוצה!

**פתרון:** המפתח לא הוגדר ב-GitHub Secrets.

👉 **קרא:** [הוראות-הוספת-Secrets-GitHub.md](./הוראות-הוספת-Secrets-GitHub.md)

בקצרה:
1. Repository → Settings → Secrets → Actions
2. New repository secret
3. Name: `SSH_PRIVATE_KEY`
4. Value: העתק **הכל** מ-`cat ~/.ssh/gha_ed25519` (בשרת)
5. Add secret

---

## 📄 מסמכים נוספים

- [מדריך מפורט באנגלית](./GITHUB-SSH-DEPLOYMENT-SETUP.md)
- [Atomic Deployment Guide](./ATOMIC-DEPLOYMENT-GUIDE.md)

---

**עודכן:** אוקטובר 2025  
**גרסה:** 2.0 - ed25519 + ssh-agent

