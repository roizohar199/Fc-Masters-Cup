# 🎯 מדריך פשוט - תיקון WebSocket 1006

## מה יש לך עכשיו?

2 קבצים מעודכנים בקוד:
- ✅ `server/src/index.ts` - תוקן
- ✅ `server/src/presence.ts` - תוקן

**זה הכל! שאר הקבצים (MD, TXT, SH) זה רק תיעוד עזר - לא חייבים אותם.**

---

## 🚀 מה לעשות עכשיו?

### שלב 1: העלה לגיט (במחשב שלך - Windows)

```powershell
git add server/src/index.ts server/src/presence.ts
git commit -m "Fix WebSocket 1006"
git push origin master
```

### שלב 2: התחבר לשרת

התחבר לשרת דרך **PuTTY** או **SSH**:
- IP: `149.50.141.69`
- User: `root`
- Password: הסיסמה שלך

### שלב 3: בשרת - הרץ את הפקודות האלה

```bash
# עבור לתיקייה
cd /var/www/fcmasters

# משוך את הקוד החדש
git pull origin master

# בנה את הקוד
cd server
npm run build

# אם הכל עבד - תראה הודעה ירוקה

# הפעל מחדש את השרת
pm2 restart server

# בדוק שהשרת עובד
pm2 logs server --lines 30
```

### שלב 4: עדכן את Nginx (בשרת)

```bash
# גבה את התצורה הנוכחית
sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup

# פתח את קובץ התצורה
sudo nano /etc/nginx/sites-available/fcmasters
```

**עכשיו במחשב שלך (Windows):**
- פתח את הקובץ: `nginx-config-websocket-fixed.txt`
- **העתק את כל התוכן**

**חזור לשרת (PuTTY):**
- במסך ה-nano, לחץ `Ctrl+K` כמה פעמים כדי למחוק הכל
- לחץ לחיצה ימנית כדי להדביק את התוכן החדש
- לחץ `Ctrl+X`, אחר כך `Y`, אחר כך `Enter` כדי לשמור

```bash
# בדוק שהתצורה תקינה
sudo nginx -t

# אם יש הודעה "test is successful" - אז טוב!
# עכשיו reload
sudo systemctl reload nginx
```

### שלב 5: בדוק שעובד

1. **פתח דפדפן** → https://www.k-rstudio.com
2. **לחץ F12** → עבור ל-Console
3. **חפש הודעות:**
   - ✅ "WebSocket connected successfully"
   - ✅ "Presence hello: X users"

**אם אתה רואה את זה - הצלחת! 🎉**

---

## 📌 לסיכום - מה עשינו?

1. ✅ תיקנו את הקוד ב-Node.js (server)
2. ✅ העלינו לגיט
3. ✅ משכנו לשרת
4. ✅ בנינו מחדש
5. ✅ עדכנו את Nginx
6. ✅ הפעלנו מחדש

**זהו! WebSocket אמור לעבוד ללא שגיאות 1006.**

---

## ❓ אם משהו לא עובד

### בעיה: "git pull" נכשל

```bash
# אולי יש שינויים מקומיים - תשמור אותם
git stash
git pull origin master
```

### בעיה: "npm run build" נכשל

```bash
# התקן dependencies מחדש
cd /var/www/fcmasters/server
npm install
npm run build
```

### בעיה: Nginx test נכשל

```bash
# החזר את הגיבוי
sudo cp /etc/nginx/sites-available/fcmasters.backup /etc/nginx/sites-available/fcmasters
sudo nginx -t
```

### בעיה: עדיין רואה 1006

```bash
# בדוק לוגים
pm2 logs server --lines 100

# אם צריך - הפעל מחדש הכל
pm2 restart server
sudo systemctl restart nginx
```

---

## 💡 לגבי כל הקבצים שיצרתי

- **MD, TXT** = תיעוד עזר (אופציונלי - לקריאה אם רוצה פרטים)
- **PS1** = סקריפט אוטומטי (אופציה להריץ הכל אוטומטית)
- **SH** = סקריפט לשרת (אופציונלי)

**אתה לא חייב להשתמש בהם!** המדריך הזה מספיק.

---

**אם אתה רוצה לעשות הכל אוטומטית - פשוט הרץ:**

```powershell
.\deploy-websocket-fix.ps1
```

**זהו! בהצלחה! 🚀**

