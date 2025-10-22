# הגדרת SSH Deployment ל-GitHub Actions

מדריך שלב-אחר-שלב לתיקון בעיות SSH בדפלוי אוטומטי ל-VPS.

## 🎯 מה זה מתקן?

- ✅ **Permission denied (publickey,password)** - בעיית אימות SSH
- ✅ **Load key /home/runner/.ssh/id_rsa: error in libcrypto** - מפתח פגום/לא תקין
- ✅ דפלוי אטומי ללא דאון-טיים
- ✅ שימוש במפתח ed25519 מודרני ומאובטח

---

## 📋 שלב 1: יצירת מפתח SSH חדש בשרת

התחבר לשרת ה-VPS שלך (באמצעות PuTTY, SSH או כל כלי אחר) והרץ:

```bash
# יצירת מפתח ed25519 חדש ללא סיסמה (בשביל CI/CD)
ssh-keygen -t ed25519 -C "gha-fcmasters" -f ~/.ssh/gha_ed25519 -N ""

# הצגת המפתח הציבורי
cat ~/.ssh/gha_ed25519.pub
```

### הוספת המפתח הציבורי ל-authorized_keys

```bash
# הוספת המפתח לקובץ הרשאות SSH
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys

# הגדרת הרשאות נכונות (חובה!)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/gha_ed25519
```

### העתקת המפתח הפרטי

```bash
# הצגת המפתח הפרטי (להעתקה)
cat ~/.ssh/gha_ed25519
```

**חשוב:** העתק את **כל** תוכן המפתח הפרטי, כולל:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 🔐 שלב 2: הגדרת Secrets ב-GitHub

עבור אל ה-repository שלך ב-GitHub:

1. **Settings** → **Secrets and variables** → **Actions**
2. לחץ על **New repository secret**
3. הוסף את הסודות הבאים:

### רשימת Secrets נדרשים

| שם הסוד | ערך | דוגמה | הסבר |
|---------|-----|--------|------|
| `SSH_PRIVATE_KEY` | תוכן המפתח הפרטי | ראה למעלה | המפתח מ-`~/.ssh/gha_ed25519` |
| `SSH_HOST` | כתובת ה-IP או דומיין | `203.0.113.10` | כתובת השרת |
| `SSH_USER` | שם המשתמש ב-VPS | `ubuntu` / `root` | המשתמש לדפלוי |
| `SSH_PORT` | פורט SSH | `22` | אופציונלי (ברירת מחדל: 22) |
| `DEPLOY_PATH` | נתיב יעד בשרת | `/var/www/fcmasters` | אופציונלי (ברירת מחדל: /var/www/fcmasters) |

### הוספת SSH_PRIVATE_KEY - נקודות חשובות

⚠️ **אל תעשה את זה:**
- ❌ אל תקודד ל-Base64
- ❌ אל תוסיף רווחים או שורות ריקות
- ❌ אל תשנה את פורמט השורות (CRLF → LF)

✅ **כך צריך להעתיק:**
1. פתח את הקובץ עם `cat ~/.ssh/gha_ed25519`
2. סמן **הכל** (Ctrl+A)
3. העתק (Ctrl+C)
4. הדבק ישירות ב-GitHub Secret

---

## 🖥️ שלב 3: הכנת השרת לדפלוי

צור את מבנה התיקיות בשרת:

```bash
# התחברות לשרת
ssh user@your-server

# יצירת תיקיות
sudo mkdir -p /var/www/fcmasters/releases
sudo chown -R $USER:$USER /var/www/fcmasters

# אימות הרשאות
ls -la /var/www/fcmasters
```

---

## 🧪 שלב 4: בדיקת החיבור

אפשר לבדוק את החיבור מהמחשב המקומי:

```bash
# שמירת המפתח הפרטי לקובץ זמני
nano /tmp/test_key
# הדבק את המפתח ושמור

# הגדרת הרשאות
chmod 600 /tmp/test_key

# בדיקת חיבור
ssh -i /tmp/test_key -p 22 user@your-server "echo 'SSH works!'"

# מחיקת הקובץ הזמני
rm /tmp/test_key
```

---

## 🚀 שלב 5: טריגר לדפלוי

לאחר הגדרת כל הסודות:

1. בצע commit ו-push ל-branch `master`
2. GitHub Actions יתחיל אוטומטית
3. עקוב אחרי התהליך ב-**Actions** tab

```bash
git add .
git commit -m "fix: update SSH deployment configuration"
git push origin master
```

---

## 🔍 פתרון בעיות נפוצות

### שגיאה: Permission denied (publickey)

**סיבה:** המפתח הציבורי לא נמצא ב-`authorized_keys` או שהרשאות לא נכונות.

**פתרון:**
```bash
# בדוק שהמפתח קיים
grep "gha-fcmasters" ~/.ssh/authorized_keys

# תקן הרשאות
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### שגיאה: Host key verification failed

**סיבה:** השרת לא נמצא ב-`known_hosts`.

**פתרון:** ה-workflow מטפל בזה אוטומטית עם `ssh-keyscan`. אם עדיין יש בעיה:
```bash
# במחשב המקומי
ssh-keyscan -p 22 your-server >> ~/.ssh/known_hosts
```

### שגיאה: rsync command not found

**פתרון:**
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y rsync

# CentOS/RHEL
sudo yum install -y rsync
```

### שגיאה: npm ci fails in deployment

**סיבה:** `package-lock.json` לא הועלה או לא מעודכן.

**פתרון:**
```bash
cd server
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

---

## 📊 מבנה הדפלוי האטומי

הדפלוי משתמש במבנה releases עם symlink:

```
/var/www/fcmasters/
├── current -> releases/42/          # symlink לגרסה הפעילה
├── releases/
│   ├── 38/                         # גרסה ישנה
│   ├── 39/                         # גרסה ישנה
│   ├── 40/                         # גרסה ישנה
│   ├── 41/                         # גרסה ישנה
│   └── 42/                         # גרסה נוכחית
│       ├── server/
│       │   └── dist/
│       ├── client/
│       │   └── dist/
│       ├── .env                    # מועתק מהגרסה הקודמת
│       └── tournaments.sqlite      # מועתק מהגרסה הקודמת
```

**יתרונות:**
- ✅ אין דאון-טיים (החלפה אטומית של symlink)
- ✅ rollback מהיר (החזרת symlink לגרסה קודמת)
- ✅ שמירת 5 גרסאות אחרונות
- ✅ העתקה אוטומטית של .env ו-DB

---

## 🔄 Rollback לגרסה קודמת

אם משהו השתבש, ניתן לחזור לגרסה קודמת בקלות:

```bash
# התחברות לשרת
ssh user@your-server

# רשימת גרסאות זמינות
ls -lt /var/www/fcmasters/releases

# החזרה לגרסה 41 (לדוגמה)
ln -sfn /var/www/fcmasters/releases/41 /var/www/fcmasters/current

# אתחול שירות
pm2 reload fcmasters
# או
sudo systemctl restart fcmasters
```

---

## 🎓 הבדלים בין המפתח הישן לחדש

| נושא | מפתח ישן (id_rsa) | מפתח חדש (ed25519) |
|------|-------------------|---------------------|
| אלגוריתם | RSA-2048 | Ed25519 |
| אבטחה | בינונית | גבוהה מאוד |
| גודל | 3,381 bytes | ~400 bytes |
| מהירות | איטי | מהיר מאוד |
| תמיכה | ישנה | מודרנית |
| בעיות | libcrypto errors | ללא בעיות |

---

## ✅ Checklist סופי

- [ ] יצרתי מפתח ed25519 חדש בשרת
- [ ] הוספתי את המפתח הציבורי ל-`authorized_keys`
- [ ] הגדרתי הרשאות נכונות (700/600)
- [ ] הוספתי את `SSH_PRIVATE_KEY` ל-GitHub Secrets
- [ ] הוספתי את `SSH_HOST` ל-GitHub Secrets
- [ ] הוספתי את `SSH_USER` ל-GitHub Secrets
- [ ] (אופציונלי) הוספתי `SSH_PORT` ו-`DEPLOY_PATH`
- [ ] יצרתי את תיקיית `/var/www/fcmasters/releases` בשרת
- [ ] ביצעתי commit ו-push
- [ ] בדקתי שה-deployment עובר ב-GitHub Actions

---

## 🆘 עזרה נוספת

אם עדיין יש בעיות:

1. בדוק את ה-logs ב-GitHub Actions → **Actions** tab → בחר run → לחץ על השלב שנכשל
2. הרץ בדיקת SSH מקומית (ראה "בדיקת החיבור" למעלה)
3. בדוק logs בשרת: `sudo tail -f /var/log/auth.log`

---

**עודכן:** אוקטובר 2025  
**גרסת Workflow:** v2.0 (ssh-agent + ed25519)

