# 🔐 מדריך מפורט להוספת Secrets ב-GitHub

## 🎯 למה אני כאן?

קיבלת שגיאה: `Error: The ssh-private-key argument is empty...`

**הסיבה:** לא הוספת את הסודות (Secrets) ב-GitHub Actions.

---

## 📋 סודות נדרשים - רשימת מה צריך להוסיף

| # | שם הסוד | חובה? | דוגמה | איפה לקחת |
|---|---------|-------|--------|-----------|
| 1 | `SSH_PRIVATE_KEY` | ✅ **חובה** | `-----BEGIN OPENSSH PRIVATE KEY-----...` | מהשרת: `cat ~/.ssh/gha_ed25519` |
| 2 | `SSH_HOST` | ✅ **חובה** | `203.0.113.10` | מהשרת: `curl -4 ifconfig.me` |
| 3 | `SSH_USER` | ✅ **חובה** | `ubuntu` | מהשרת: `whoami` |
| 4 | `SSH_PORT` | ⭕ אופציונלי | `22` | רק אם שינית את פורט SSH |
| 5 | `DEPLOY_PATH` | ⭕ אופציונלי | `/var/www/fcmasters` | רק אם הנתיב שונה |

---

## 🚀 שלב-אחר-שלב: הוספת Secrets

### שלב 1: היכנס ל-Repository שלך ב-GitHub

1. פתח דפדפן וגש ל-GitHub
2. היכנס ל-repository של הפרויקט
3. URL ייראה כך: `https://github.com/USERNAME/REPO-NAME`

---

### שלב 2: פתח את דף Secrets

1. לחץ על **Settings** (בפס העליון של ה-repository)
2. בתפריט הצד (שמאל), גלול למטה למדור **Security**
3. לחץ על **Secrets and variables** (יפתח תת-תפריט)
4. לחץ על **Actions**

**אתה אמור לראות:**
- כפתור ירוק: **New repository secret**
- (אם יש כבר secrets, תראה רשימה)

---

### שלב 3: הוספת הסוד הראשון - SSH_PRIVATE_KEY

#### 3.1 - לחץ על הכפתור הירוק "New repository secret"

#### 3.2 - מלא את הפרטים:

**Name:** (שדה ראשון)
```
SSH_PRIVATE_KEY
```
(בדיוק ככה, באותיות גדולות, עם קו תחתון)

**Secret:** (שדה גדול למטה)

**עכשיו תעתיק את המפתח מהשרת:**

1. התחבר לשרת VPS (SSH/PuTTY)
2. הרץ:
   ```bash
   cat ~/.ssh/gha_ed25519
   ```
3. תראה משהו כזה:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   QyNTUxOQAAACBj4JvLq1Z4vN5d3Hx5pG8zQwX9nX8qZYvN3vH7mK9fHQAAAJiP2xJTj9sS
   UwAAAAtzc2gtZWQyNTUxOQAAACBj4JvLq1Z4vN5d3Hx5pG8zQwX9nX8qZYvN3vH7mK9fHQ
   AAAEDh8RvNxK+7sL5mF9qW3pT8nZ4xY6vL2qH9fN7kJ8wRY2Pgm8urVni83l3cfHmkbzND
   Bf2dfypli83e8fuYr18dAAAAE2doYS1mY21hc3RlcnNAc2VydmVyAQIDBA==
   -----END OPENSSH PRIVATE KEY-----
   ```

4. **סמן הכל** (כולל השורות `BEGIN` ו-`END`)
5. **העתק** (Ctrl+C או קליק ימני → Copy)
6. **הדבק** בשדה "Secret" ב-GitHub

**⚠️ חשוב מאוד:**
- ✅ כל השורות (מ-`BEGIN` עד `END` כולל!)
- ✅ בדיוק כמו שהוא - אל תשנה כלום
- ❌ בלי רווחים נוספים בהתחלה או בסוף
- ❌ בלי Base64 או קידוד אחר

#### 3.3 - שמור את הסוד

לחץ על **Add secret** (כפתור ירוק למטה)

✅ **סוד #1 נוסף!**

---

### שלב 4: הוספת הסוד השני - SSH_HOST

1. לחץ שוב על **New repository secret**

2. **Name:**
   ```
   SSH_HOST
   ```

3. **Secret:** (כתובת IP של השרת)
   
   **איך לדעת מה ה-IP?**
   
   התחבר לשרת והרץ:
   ```bash
   curl -4 ifconfig.me
   ```
   
   או:
   ```bash
   hostname -I | awk '{print $1}'
   ```
   
   תקבל משהו כמו: `203.0.113.10`
   
   העתק והדבק את זה בשדה "Secret"

4. לחץ **Add secret**

✅ **סוד #2 נוסף!**

---

### שלב 5: הוספת הסוד השלישי - SSH_USER

1. לחץ שוב על **New repository secret**

2. **Name:**
   ```
   SSH_USER
   ```

3. **Secret:** (שם המשתמש בשרת)
   
   **איך לדעת מה השם?**
   
   התחבר לשרת והרץ:
   ```bash
   whoami
   ```
   
   תקבל משהו כמו: `ubuntu` או `root` או `admin`
   
   העתק והדבק את זה בשדה "Secret"

4. לחץ **Add secret**

✅ **סוד #3 נוסף!**

---

### שלב 6 (אופציונלי): SSH_PORT

**רק אם** שינית את פורט SSH (לא 22):

1. **Name:** `SSH_PORT`
2. **Secret:** הפורט שלך (לדוגמה: `2222`)
3. לחץ **Add secret**

---

### שלב 7 (אופציונלי): DEPLOY_PATH

**רק אם** הנתיב שלך שונה מ-`/var/www/fcmasters`:

1. **Name:** `DEPLOY_PATH`
2. **Secret:** הנתיב המלא (לדוגמה: `/home/ubuntu/myapp`)
3. לחץ **Add secret**

---

## ✅ אימות שהכל תקין

אחרי שהוספת את כל הסודות, אתה אמור לראות **ברשימת Secrets**:

```
SSH_PRIVATE_KEY     Updated X seconds ago
SSH_HOST            Updated X seconds ago  
SSH_USER            Updated X seconds ago
```

(ו-SSH_PORT, DEPLOY_PATH אם הוספת)

**⚠️ לא תוכל לראות את התוכן של הסודות!** זה נורמלי - GitHub מסתיר אותם.

---

## 🧪 בדיקה - האם זה עובד?

### אפשרות 1: Push ובדיקה

```bash
git add .
git commit -m "test: check deployment with secrets"
git push origin master
```

אחר כך:
1. GitHub → **Actions** tab
2. לחץ על הריצה האחרונה
3. לחץ על **deploy** job
4. בדוק את שלב **"Validate required secrets"**

**אם רואה:**
```
✅ Secrets validated successfully
   SSH Key length: 2602 characters
   SSH Host: 203.0.113.10
   SSH User: ubuntu
```

🎉 **הכל תקין!** הדפלוי ימשיך.

**אם רואה:**
```
❌ Missing SSH_PRIVATE_KEY (or PROD_SSH_PRIVATE_KEY)
```

❌ הסוד לא הוגדר נכון. חזור על השלבים.

---

### אפשרות 2: בדיקה מקומית (מתקדמים)

```bash
# שמור את המפתח לקובץ זמני
ssh your-server "cat ~/.ssh/gha_ed25519" > /tmp/test_key
chmod 600 /tmp/test_key

# בדוק חיבור
ssh -i /tmp/test_key -p 22 ubuntu@your-server "echo 'Connection OK'"

# מחק
rm /tmp/test_key
```

אם ראית "Connection OK" - המפתח תקין!

---

## 🆘 פתרון בעיות נפוצות

### שגיאה: "The ssh-private-key argument is empty"

**סיבה:** הסוד `SSH_PRIVATE_KEY` לא הוגדר או ריק.

**פתרון:**
1. בדוק שהשם **בדיוק** `SSH_PRIVATE_KEY` (אותיות גדולות!)
2. בדוק שהדבקת את **כל** המפתח (מ-BEGIN עד END)
3. נסה למחוק את הסוד ולהוסיף אותו מחדש

---

### שגיאה: "Missing SSH_HOST"

**סיבה:** לא הוספת את `SSH_HOST`.

**פתרון:**
1. וודא שהוספת סוד בשם `SSH_HOST`
2. וודא שהערך הוא IP תקין (לא רווח, לא http://)

---

### שגיאה: "Permission denied (publickey)"

**סיבה אפשרית 1:** המפתח הפרטי לא תואם למפתח הציבורי בשרת.

**פתרון:**
```bash
# בשרת - בדוק ש-authorized_keys מכיל את המפתח הציבורי
cat ~/.ssh/gha_ed25519.pub
grep "gha-fcmasters" ~/.ssh/authorized_keys

# אם אין התאמה:
cat ~/.ssh/gha_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**סיבה אפשרית 2:** המפתח הועתק עם CRLF (Windows).

**פתרון:**
- העתק את המפתח מהשרת דרך `cat` (לא דרך עורך טקסט Windows)
- או המר את הקובץ ל-LF בלבד (Notepad++ → Edit → EOL Conversion → Unix (LF))

---

### המפתח שהעתקתי ארוך מדי / קצר מדי

**מפתח ed25519 תקין צריך להיות:**
- בערך 2,500-2,700 תווים
- מתחיל ב-`-----BEGIN OPENSSH PRIVATE KEY-----`
- מסתיים ב-`-----END OPENSSH PRIVATE KEY-----`
- 15-20 שורות

אם זה לא כך:
1. צור מפתח חדש (ראה [הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md))
2. העתק שוב בזהירות

---

### אני לא בטוח אם העתקתי נכון

**בדיקה מהירה:**

המפתח צריך להיראות **בדיוק** ככה:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
[עוד שורות...]
-----END OPENSSH PRIVATE KEY-----
```

- ✅ שורה ראשונה: `-----BEGIN OPENSSH PRIVATE KEY-----`
- ✅ שורה אחרונה: `-----END OPENSSH PRIVATE KEY-----`
- ✅ ביניהן: תווים אקראיים (Base64)
- ❌ **בלי** רווחים בהתחלה
- ❌ **בלי** שורות ריקות מיותרות

---

## 📚 מסמכים נוספים

- [תיקון-SSH-Deploy.md](./תיקון-SSH-Deploy.md) - מדריך מהיר
- [הוראות-SSH-Key-Setup.md](./הוראות-SSH-Key-Setup.md) - יצירת מפתח בשרת
- [GITHUB-SSH-DEPLOYMENT-SETUP.md](./GITHUB-SSH-DEPLOYMENT-SETUP.md) - מדריך מפורט

---

## 🎯 Checklist סופי

לפני שממשיכים:

- [ ] הוספתי `SSH_PRIVATE_KEY` (כל המפתח, מ-BEGIN עד END)
- [ ] הוספתי `SSH_HOST` (IP של השרת)
- [ ] הוספתי `SSH_USER` (שם משתמש בשרת)
- [ ] (אופציונלי) הוספתי `SSH_PORT` אם צריך
- [ ] (אופציונלי) הוספתי `DEPLOY_PATH` אם צריך
- [ ] אני רואה את כל הסודות ברשימת Secrets
- [ ] ביצעתי `git push` לבדיקה

אם סימנת הכל ✅ - **אתה מוכן!** 🚀

---

**נוצר:** אוקטובר 2025  
**גרסה:** 1.0  
**למטרה:** פתרון "ssh-private-key argument is empty"

