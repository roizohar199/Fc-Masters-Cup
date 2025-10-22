# מיגרציה למפתחות SSH חדשים (ed25519)

## 🎯 למי זה?

אם יש לך כבר deployment עובד עם GitHub Actions, אבל אתה רואה:
- ❌ `Permission denied (publickey,password)`
- ❌ `Load key /home/runner/.ssh/id_rsa: error in libcrypto`
- ⚠️ מפתחות RSA ישנים

**מדריך זה יעזור לך לעדכן בבטחה ללא downtime.**

---

## 🔄 תאימות לאחור

ה-workflow החדש **תומך** בשמות סודות ישנים:

| שם ישן | שם חדש | הערות |
|--------|--------|-------|
| `VPS_HOST` | `SSH_HOST` | שניהם עובדים |
| `VPS_USER` | `SSH_USER` | שניהם עובדים |
| - | `SSH_PORT` | חדש, אופציונלי (ברירת מחדל: 22) |
| - | `DEPLOY_PATH` | חדש, אופציונלי (ברירת מחדל: /var/www/fcmasters) |

**אתה יכול:**
1. להשאיר את הסודות הישנים (VPS_HOST, VPS_USER) - יעבוד!
2. לעדכן אותם לשמות חדשים (SSH_HOST, SSH_USER) - מומלץ
3. לעבור בהדרגה

---

## 📋 אסטרטגיית מיגרציה מומלצת

### אפשרות 1: מיגרציה בטוחה בהדרגה (מומלץ)

**שלב 1: הוסף מפתח חדש מבלי למחוק את הישן**

1. צור מפתח ed25519 חדש בשרת (ראה [הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md))
2. הוסף secret חדש `SSH_PRIVATE_KEY_NEW` ב-GitHub (זמני)
3. בדוק שהוא עובד
4. החלף `SSH_PRIVATE_KEY` ← `SSH_PRIVATE_KEY_NEW`
5. מחק את `SSH_PRIVATE_KEY_NEW`

**שלב 2: עדכן שמות סודות (אופציונלי)**

1. הוסף `SSH_HOST` (עם אותו ערך כמו `VPS_HOST`)
2. הוסף `SSH_USER` (עם אותו ערך כמו `VPS_USER`)
3. בדוק שהדפלוי עובד
4. מחק את `VPS_HOST` ו-`VPS_USER` הישנים

---

### אפשרות 2: מיגרציה מהירה (רק אם אתה בטוח)

**תנאים:**
- יש לך גישה מלאה לשרת VPS
- אתה יכול לעשות rollback ידני אם משהו ישתבש

**צעדים:**

1. **בשרת VPS:**
   ```bash
   ssh-keygen -t ed25519 -C "gha-fcmasters" -f ~/.ssh/gha_ed25519 -N ""
   cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
   cat ~/.ssh/gha_ed25519  # העתק את זה
   ```

2. **ב-GitHub Secrets:**
   - עדכן את `SSH_PRIVATE_KEY` (החלף את הערך)
   - אופציונלי: שנה שמות `VPS_HOST` → `SSH_HOST`, `VPS_USER` → `SSH_USER`

3. **בדיקה:**
   ```bash
   git commit --allow-empty -m "test: verify new SSH key"
   git push origin master
   ```

4. **עקוב ב-GitHub Actions**
   - אם עובד ✅ - מחק את המפתח הישן מהשרת
   - אם נכשל ❌ - החזר את המפתח הישן ל-`SSH_PRIVATE_KEY`

---

## 🧪 בדיקה לפני מיגרציה

**בדוק שהמפתח החדש עובד לפני לעדכן את GitHub:**

### 1. שמור את המפתח החדש לקובץ זמני

```bash
# במחשב המקומי (Linux/Mac)
nano /tmp/new_key
# הדבק את המפתח שהעתקת מהשרת
chmod 600 /tmp/new_key

# Windows PowerShell
notepad $env:TEMP\new_key
# הדבק ושמור
```

### 2. בדוק חיבור

```bash
# Linux/Mac
ssh -i /tmp/new_key -p 22 user@your-server "echo 'New key works!'"

# Windows PowerShell
ssh -i $env:TEMP\new_key -p 22 user@your-server "echo 'New key works!'"
```

### 3. בדוק rsync (כמו בדפלוי)

```bash
# צור קובץ בדיקה
echo "test" > /tmp/test.txt

# נסה להעלות (Linux/Mac)
rsync -az -e "ssh -i /tmp/new_key -p 22" /tmp/test.txt user@your-server:/tmp/

# Windows PowerShell
rsync -az -e "ssh -i $env:TEMP\new_key -p 22" $env:TEMP\test.txt user@your-server:/tmp/
```

אם כל הבדיקות עברו ✅ - המפתח החדש מוכן!

### 4. נקה

```bash
# Linux/Mac
rm /tmp/new_key /tmp/test.txt

# Windows PowerShell
Remove-Item $env:TEMP\new_key, $env:TEMP\test.txt
```

---

## 🔙 Rollback במקרה בעיה

### אם הדפלוי נכשל אחרי המיגרציה:

**אפשרות 1: החזרת מפתח ישן ב-GitHub Secrets (מהיר)**

1. GitHub → Settings → Secrets → Actions
2. ערוך `SSH_PRIVATE_KEY`
3. החזר את המפתח הישן (אם שמרת אותו)
4. Save
5. Re-run failed job

**אפשרות 2: הוספת מפתח חדש בשרת (אם המפתח נמחק)**

```bash
# התחבר לשרת דרך console/PuTTY
ssh user@your-server

# צור מפתח חדש
ssh-keygen -t ed25519 -C "recovery" -f ~/.ssh/recovery_key -N ""
cat ~/.ssh/recovery_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# הצג והעתק
cat ~/.ssh/recovery_key
```

עדכן את `SSH_PRIVATE_KEY` ב-GitHub.

**אפשרות 3: Rollback ידני בשרת**

```bash
# התחבר לשרת
ssh user@your-server

# חזור לגרסה קודמת
cd /var/www/fcmasters
ls -lt releases/  # ראה מספר גרסה קודמת
ln -sfn releases/PREVIOUS_NUMBER current

# אתחל שירות
pm2 reload fcmasters
# או
sudo systemctl restart fcmasters
```

---

## 📊 טבלת השוואה

| נושא | לפני מיגרציה | אחרי מיגרציה |
|------|---------------|---------------|
| סוג מפתח | RSA (id_rsa) | Ed25519 |
| שיטת טעינה | `echo > ~/.ssh/id_rsa` | `ssh-agent` |
| בעיות | libcrypto, Permission denied | ✅ ללא בעיות |
| אבטחה | בינונית | גבוהה |
| מהירות | איטי | מהיר |
| תמיכה | ישנה | מודרנית |

---

## ✅ Checklist מיגרציה

### לפני:
- [ ] יש לי גישה לשרת VPS (SSH או console)
- [ ] גיבוי של הסודות הנוכחיים (שמרתי את המפתח הישן)
- [ ] יודע איך לעשות rollback אם צריך

### תהליך:
- [ ] יצרתי מפתח ed25519 חדש בשרת
- [ ] בדקתי שהמפתח עובד (SSH + rsync)
- [ ] עדכנתי `SSH_PRIVATE_KEY` ב-GitHub Secrets
- [ ] (אופציונלי) עדכנתי שמות לשמות חדשים
- [ ] ביצעתי push ובדקתי שהדפלוי עבר

### אחרי:
- [ ] הדפלוי עובד ב-GitHub Actions ✅
- [ ] האפליקציה עובדת בפרודקשן ✅
- [ ] מחקתי מפתחות ישנים מהשרת
- [ ] עדכנתי תיעוד פנימי

---

## 🆘 בעיות נפוצות במיגרציה

### שגיאה: "Permission denied" אחרי עדכון המפתח

**סיבה:** המפתח החדש לא הוכנס כראוי ל-`authorized_keys`

**פתרון:**
```bash
# בשרת
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### שגיאה: "Bad owner or permissions"

**סיבה:** הרשאות שגויות על תיקיית .ssh

**פתרון:**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/gha_ed25519
```

### שגיאה: "ssh-agent: command not found"

**סיבה:** ה-action `webfactory/ssh-agent` לא נמצא

**פתרון:** ודא שה-workflow מעודכן לגרסה האחרונה (ראה [.github/workflows/deploy.yml](./.github/workflows/deploy.yml))

---

## 📚 קישורים שימושיים

- [תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md) - מדריך מהיר
- [הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md) - יצירת מפתח חדש
- [GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md) - מדריך מפורט

---

**עודכן:** אוקטובר 2025  
**גרסה:** 1.0 - Migration Guide

