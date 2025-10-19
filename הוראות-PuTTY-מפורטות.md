<div dir="rtl" style="text-align: right;">

# 📡 הוראות מפורטות - התחברות לשרת והוספת Public Key

---

## 🎯 מה אנחנו עושים?

מוסיפים את ה-**Public Key** לשרת שלך, כדי ש-GitHub Actions יוכל להתחבר אליו אוטומטית.

---

## 📝 שלב 1: התחבר לשרת ב-PuTTY

### 1.1 פתח PuTTY

אם אין לך PuTTY, הורד מכאן: https://www.putty.org/

### 1.2 מלא פרטי חיבור

בחלון PuTTY:

```
Host Name (or IP address): [ה-IP של השרת שלך מHostinger]
Port: 22
Connection type: SSH
```

**לדוגמה:**
```
Host Name: 123.456.789.10
Port: 22
```

### 1.3 לחץ "Open"

תקבל אזהרה "PuTTY Security Alert" - לחץ **Yes**

### 1.4 התחבר

```
login as: fcmaster
password: [הסיסמה שלך]
```

**הסיסמה לא תופיע בזמן ההקלדה - זה נורמלי!**

---

## 🔑 שלב 2: הוסף את ה-Public Key

### 2.1 בשרת, הרץ את הפקודה הזו:

```bash
mkdir -p ~/.ssh
```

זה יוצר תיקייה בשם `.ssh` (אם היא לא קיימת).

### 2.2 הרץ:

```bash
chmod 700 ~/.ssh
```

זה נותן הרשאות נכונות לתיקייה.

### 2.3 פתח את קובץ authorized_keys:

```bash
nano ~/.ssh/authorized_keys
```

זה פותח עורך טקסט בשם `nano`.

### 2.4 הדבק את ה-Public Key

**עכשיו זה החלק החשוב!**

#### ב-Windows (המחשב שלך):
1. פתח את הקובץ: `הוראות-התחלה-עכשיו.md`
2. גלול ל-**"PUBLIC KEY (להעתקה לשרת)"**
3. **העתק את כל השורה** שמתחילה ב-`ssh-rsa` וגומרת ב-`github-actions-fc-masters`

השורה נראית כך:
```
ssh-rsa AAAAB3NzaC1yc2EAAA... [המון תווים] ...github-actions-fc-masters
```

**העתק את כל השורה הזו!**

#### בPuTTY (השרת):
1. במסך ה-`nano` - **לחץ לחיצה ימנית בעכבר**
2. ה-Public Key יודבק!

**חשוב:** ודא שזו **שורה אחת ארוכה** (לא כמה שורות מחולקות!)

### 2.5 שמור וצא

```
לחץ: Ctrl + O  (זה אות O לא אפס!)
לחץ: Enter
לחץ: Ctrl + X
```

### 2.6 תן הרשאות נכונות:

```bash
chmod 600 ~/.ssh/authorized_keys
```

---

## ✅ שלב 3: בדוק שזה עבד

### 3.1 התנתק מהשרת:

```bash
exit
```

### 3.2 נסה להתחבר שוב דרך PowerShell (במחשב שלך):

```powershell
ssh -i $env:USERPROFILE\.ssh\github_actions_rsa fcmaster@[ה-IP-שלך]
```

**החלף `fcmaster` בשם המשתמש שלך!**  
**החלף `[ה-IP-שלך]` ב-IP האמיתי!**

לדוגמה:
```powershell
ssh -i $env:USERPROFILE\.ssh\github_actions_rsa fcmaster@123.456.789.10
```

### 3.3 אם זה עובד:
- אתה אמור להתחבר **ללא סיסמה**! ✅
- זה אומר שה-SSH Key עובד!

### 3.4 אם זה לא עובד:
- ודא שהעתקת את **כל** ה-Public Key
- ודא שזו **שורה אחת** (לא מחולקת)
- הרץ שוב את: `chmod 600 ~/.ssh/authorized_keys` בשרת

---

## 📸 תמונות המחשה

### איך זה צריך להיראות ב-nano:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDbTHNxaRTqWBabTMjgoeWUDWVze1cmdBKCJDRQJ6RRk0y4ZVn5cYrXjXGtUQ+qw+o5YQ7k0wr2mDDyFXM2lRkOgYMUsXUJdEMUknmgBi0WNuUoiH1EgVjE8h9Vvg436PUmjmzJOL2VBaSFy/34l9AohZAy8zB4l8FiQMViXvOAK5H83nePo+lUd+UZ8t4uH+uqWAfZlb9MqQS0JP7JPPZrJyzRohFsr05OzGgq6Lm4nP2hn6FYRoDRDSb2s41bwDhgv/Gwq5PWpYCIm7RNDUN6xLCOW4OaGlV7v8CxxS4/DPcUkqK6nU8q5A3ebp9BBXIQ8WMEDi9dFphalnfpsobpfIZyufJhFWIRHJT/5VzpUgugL9GlxgyOhggtm7IEsfIA4AkEt7dx3fGOGkE5FUj71/7NUOreoP87t4e20KZQVGmNcW8j0JdNq2oLUtQR7bQeQbEn3Xxkd9HkuFmdxAhCjZVe46+cLyZLnErqPS5rfjGLNgmNijd/DGGaw3twWnOm7K0mx5P00MMVVuEThM+/fSHK1FTQ9++RaIOQksOzVuWrjd8AIRGHsja8KTlDV6nYSohJsZ467Mdm3CqOkTp5BMfYjACeT/N8GGE49Le/ZaGw6VkfX7H62x3GmSgJhoMvpOSfhOCJBB406Jw7vJ97ZOQt08mUVPnMrgyFZzuRhQ== github-actions-fc-masters
```

**שורה אחת ארוכה!** לא כמה שורות!

---

## 🔄 סיכום מהיר

```
┌─────────────────┐
│ 1. פתח PuTTY    │
│ 2. התחבר לשרת   │
└────────┬────────┘
         │
┌────────▼────────────────────────┐
│ 3. הרץ: mkdir -p ~/.ssh        │
│ 4. הרץ: chmod 700 ~/.ssh       │
│ 5. הרץ: nano ~/.ssh/authorized_keys │
└────────┬────────────────────────┘
         │
┌────────▼────────────────────┐
│ 6. הדבק את ה-Public Key     │
│    (לחיצה ימנית בעכבר)      │
└────────┬────────────────────┘
         │
┌────────▼─────────────────┐
│ 7. שמור: Ctrl+O, Enter   │
│ 8. צא: Ctrl+X            │
│ 9. הרץ: chmod 600...     │
└────────┬─────────────────┘
         │
┌────────▼────────┐
│ 10. בדוק חיבור │
│     (ללא סיסמה) │
└─────────────────┘
```

---

## ❓ שאלות נפוצות

### שאלה: למה בכלל צריך את זה?
**תשובה:** כדי ש-GitHub Actions יוכל להעלות קבצים לשרת שלך אוטומטית, הוא צריך "אישור" להתחבר. ה-Public Key הוא האישור הזה.

### שאלה: זה בטוח?
**תשובה:** כן! זו השיטה הכי בטוחה. רק מי שיש לו את ה-Private Key (GitHub שלך) יכול להתחבר.

### שאלה: מה אם טעיתי?
**תשובה:** אפשר תמיד לערוך שוב:
```bash
nano ~/.ssh/authorized_keys
```
ולתקן.

### שאלה: אפשר להוסיף כמה Public Keys?
**תשובה:** כן! כל שורה = Public Key אחר. אז אל תמחק keys קיימים!

---

## 🎯 הצעד הבא

אחרי שסיימת את זה, חזור ל:  
**`הוראות-התחלה-עכשיו.md`**

ועבור לשלב 2: הוספת Secrets ל-GitHub

---

**בהצלחה!** 💪

</div>

