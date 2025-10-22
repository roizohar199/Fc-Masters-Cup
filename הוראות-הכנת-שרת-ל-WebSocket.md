# 🔧 הכנת השרת ל-WebSocket - הוראות חד-פעמיות

## ⚡ TL;DR - מה צריך לעשות?

**פעם אחת בשרת**, הרץ את הסקריפט שיכין הכל:

```bash
# 1. התחבר לשרת
ssh root@your-server-ip

# 2. עבור לתיקיית הפרויקט
cd /var/www/fcmasters

# 3. הורד את הסקריפט (או העתק ידנית)
wget https://raw.githubusercontent.com/roizohar199/fcmasters/master/setup-server-for-websocket.sh

# 4. הרץ את הסקריפט
chmod +x setup-server-for-websocket.sh
sudo ./setup-server-for-websocket.sh
```

**זהו!** מעכשיו הכל יעבוד אוטומטית. ✅

---

## 📋 מה הסקריפט עושה?

הסקריפט בודק ומגדיר:
1. ✅ הרשאות sudo ל-nginx (ללא צורך בסיסמה)
2. ✅ בדיקה שנginx מותקן
3. ✅ בדיקה שPM2 מותקן
4. ✅ פתיחת פורטים 80 ו-443 ב-firewall
5. ✅ יצירת תיקיות פרויקט (אם לא קיימות)
6. ✅ בדיקה שהשרת Node.js רץ על פורט 8787

---

## 🔐 למה צריך הרשאות sudo?

GitHub Actions צריך לעדכן את תצורת Nginx אוטומטית. זה דורש:
```bash
sudo cp nginx-config.txt /etc/nginx/sites-available/fcmasters
sudo nginx -t
sudo systemctl reload nginx
```

הסקריפט מגדיר את זה **רק עבור פקודות nginx**, לא sudo מלא.

---

## 🎯 אלטרנטיבה: ידני (ללא סקריפט)

אם אתה מעדיף להגדיר ידנית:

### 1. הגדר הרשאות sudo
```bash
# בשרת, כ-root:
echo "YOUR_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /bin/cp * /etc/nginx/sites-available/*" | sudo tee /etc/sudoers.d/nginx-deploy
sudo chmod 0440 /etc/sudoers.d/nginx-deploy
```

**החלף `YOUR_USER`** במשתמש שמריץ את GitHub Actions (בדרך כלל זה המשתמש שאיתו מתחברים ב-SSH).

### 2. ודא שהפורטים פתוחים
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8787/tcp
```

### 3. ודא שהתיקיות קיימות
```bash
sudo mkdir -p /var/www/fcmasters/{server,client}
sudo chown -R $USER:$USER /var/www/fcmasters
```

---

## 📝 עדכון הדומיין (חשוב!)

**לפני ההעלאה הראשונה**, עדכן את הדומיין בקובץ `deploy-config-nginx.txt`:

```nginx
server_name fcmasters.yourdomain.com www.fcmasters.yourdomain.com;
```

**החלף ל:**
```nginx
server_name your-actual-domain.com www.your-actual-domain.com;
```

אחרת Nginx לא יקבל בקשות!

---

## 🔐 SSL/HTTPS (אם יש לך תעודה)

אם יש לך SSL certificate, יש שני אפשרויות:

### אפשרות 1: שימוש בקובץ SSL
1. שנה את שם הקובץ `deploy-config-nginx-ssl.txt` ל-`deploy-config-nginx.txt`
2. עדכן את נתיבי התעודות בקובץ:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/YOUR-DOMAIN/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/YOUR-DOMAIN/privkey.pem;
   ```

### אפשרות 2: קבל תעודה חינם (Let's Encrypt)
```bash
# בשרת:
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## ✅ בדיקה שהכל עובד

### לאחר ההעלאה הבאה, בדוק:

**1. שהשרת רץ:**
```bash
pm2 status
# צריך לראות: fc-masters | online
```

**2. שנginx עודכן:**
```bash
sudo nginx -t
# צריך לראות: syntax is ok
```

**3. שנginx טען את התצורה החדשה:**
```bash
sudo systemctl status nginx
# צריך לראות: active (running)
```

**4. ש-WebSocket עובד:**
- פתח את `test-websocket.html` בדפדפן
- או בדוק בקונסול של האתר שלך (F12)

---

## 🔍 פתרון בעיות

### בעיה: GitHub Actions נכשל על עדכון Nginx
```bash
# בדוק שיש הרשאות:
sudo -l

# צריך לראות שורות עם NOPASSWD עבור nginx
```

**פתרון:** הרץ את `setup-server-for-websocket.sh` שוב.

### בעיה: Nginx לא נטען מחדש
```bash
# בדוק logs:
sudo tail -f /var/log/nginx/error.log

# בדוק תקינות תצורה:
sudo nginx -t
```

**פתרון:** בדוק ש-`server_name` מוגדר נכון.

### בעיה: WebSocket לא מתחבר
```bash
# בדוק שהשרת רץ:
sudo netstat -tulpn | grep 8787

# בדוק logs:
pm2 logs fc-masters
```

**פתרון:** ודא ש-PM2 רץ והשרת מאזין על 8787.

---

## 🎉 סיכום

| מה | פעמים | איפה |
|-----|-------|------|
| הרצת `setup-server-for-websocket.sh` | פעם אחת | בשרת VPS |
| עדכון `server_name` בקובץ התצורה | פעם אחת | בקוד המקומי |
| דחיפה ל-GitHub | בכל עדכון | מהמחשב המקומי |
| עדכון אוטומטי של Nginx | אוטומטי | בשרת (דרך Actions) |

**אחרי הפעם הראשונה - הכל אוטומטי!** 🚀

---

**יש בעיה?** בדוק את הלוגים:
- GitHub Actions: https://github.com/roizohar199/fcmasters/actions
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- Server: `pm2 logs fc-masters`

