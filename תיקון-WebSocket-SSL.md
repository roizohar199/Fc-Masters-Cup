# 🔧 תיקון בעיית WebSocket עם HTTPS

## 🎯 הבעיה
השרת שלך מנסה להתחבר ל־WebSocket דרך `wss://www.k-rstudio.com/presence`, אבל Nginx מוגדר רק ל־HTTP (port 80) ולא ל־HTTPS (port 443).

**שגיאה בדפדפן:**
```
WebSocket connection to 'wss://www.k-rstudio.com/presence' failed
WebSocket closed: 1006
```

## ✅ הפתרון

### שלב 1: התקנת SSL Certificate (אם עדיין לא קיים)

אם עדיין לא יש לך SSL certificate, תצטרך להתקין Let's Encrypt:

```bash
# התקנת Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# יצירת SSL certificate
sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com
```

Certbot ישאל אותך מספר שאלות:
- **Email**: הכנס email תקין לקבלת התראות
- **Terms of Service**: הסכם (Y)
- **Redirect HTTP to HTTPS**: בחר Yes (מומלץ)

---

### שלב 2: עדכון תצורת Nginx

#### אופציה א': עדכון ידני (מומלץ)

1. התחבר לשרת שלך דרך SSH:
   ```bash
   ssh root@k-rstudio.com
   # או
   ssh <username>@k-rstudio.com
   ```

2. גיבוי התצורה הנוכחית:
   ```bash
   sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup
   ```

3. ערוך את תצורת Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/fcmasters
   ```

4. החלף את **כל התוכן** בתוכן הקובץ `nginx-config-k-rstudio-ssl.txt` שנוצר.

5. בדיקת תקינות התצורה:
   ```bash
   sudo nginx -t
   ```

6. אם הכל תקין, טען מחדש את Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

---

#### אופציה ב': עדכון אוטומטי (דורש קובץ בשרת)

אם יש לך גישה לקבצים:

1. העלה את הקובץ `nginx-config-k-rstudio-ssl.txt` לשרת (דרך SFTP/SCP).

2. התחבר לשרת והפעל:
   ```bash
   # גיבוי
   sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup
   
   # העתקת התצורה החדשה
   sudo cp nginx-config-k-rstudio-ssl.txt /etc/nginx/sites-available/fcmasters
   
   # בדיקה
   sudo nginx -t
   
   # טעינה מחדש
   sudo systemctl reload nginx
   ```

---

### שלב 3: וידוא שהשרת Node.js רץ

וודא שהשרת Backend רץ:

```bash
cd /var/www/fcmasters/server
pm2 status
```

אם השרת לא רץ:
```bash
pm2 restart fc-masters
# או
pm2 start npm --name "fc-masters" -- start
```

---

### שלב 4: בדיקת החיבור

1. פתח את האתר בדפדפן: `https://www.k-rstudio.com`

2. פתח את ה־Console (F12):
   - אמור להופיע: `✅ WebSocket connected successfully`
   - אמור להופיע: `👋 Presence hello: X users`

3. אם עדיין יש שגיאה, בדוק את לוגי Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. בדוק את לוגי השרת:
   ```bash
   pm2 logs fc-masters
   ```

---

## 🔍 פתרון בעיות נפוצות

### בעיה 1: SSL Certificate לא נמצא
**שגיאה:**
```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/k-rstudio.com/fullchain.pem"
```

**פתרון:**
```bash
# ודא שיש לך SSL certificate
sudo ls -la /etc/letsencrypt/live/k-rstudio.com/

# אם אין, התקן:
sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com
```

---

### בעיה 2: Port 443 תפוס
**שגיאה:**
```
nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)
```

**פתרון:**
```bash
# בדוק מי תופס את Port 443
sudo lsof -i :443

# עצור תהליכים לא רלוונטיים
sudo systemctl stop <service-name>

# טען מחדש Nginx
sudo systemctl reload nginx
```

---

### בעיה 3: WebSocket עדיין נכשל
**בדיקה:**
```bash
# ודא שהשרת Node.js מאזין על port 8787
sudo netstat -tlnp | grep 8787

# בדוק לוגים
pm2 logs fc-masters --lines 50
```

**אם השרת לא מאזין:**
```bash
# הפעל מחדש
cd /var/www/fcmasters/server
pm2 restart fc-masters

# אם זה לא עובד, הפעל ידנית
npm start
```

---

### בעיה 4: CORS Error
**שגיאה בדפדפן:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**פתרון:**
וודא שב־`.env` בשרת יש:
```env
CORS_ORIGIN=https://www.k-rstudio.com
```

הפעל מחדש:
```bash
pm2 restart fc-masters
```

---

## 📋 Check List - אחרי התיקון

- [ ] SSL Certificate מותקן (Certbot)
- [ ] Nginx מוגדר עם HTTPS (port 443)
- [ ] WebSocket מוגדר ב־Nginx (`/presence`)
- [ ] השרת Node.js רץ (pm2 status)
- [ ] CORS_ORIGIN נכון ב־`.env`
- [ ] הדפדפן מציג "✅ WebSocket connected successfully"
- [ ] אין שגיאות ב־Console

---

## 🎉 סיכום

אחרי ביצוע השלבים האלה:
1. ✅ האתר ירוץ על HTTPS
2. ✅ WebSocket יעבוד דרך WSS (מאובטח)
3. ✅ כל התעבורה תועבר אוטומטית מ־HTTP ל־HTTPS
4. ✅ נתוני הנוכחות (Presence) יעבדו בזמן אמת

---

## 🆘 עזרה נוספת

אם אתה נתקע:
1. שלח את הלוגים:
   ```bash
   sudo tail -n 50 /var/log/nginx/error.log > nginx-error.log
   pm2 logs fc-masters --lines 50 > server-logs.txt
   ```

2. בדוק את הגדרות Nginx:
   ```bash
   sudo nginx -T > nginx-full-config.txt
   ```

3. שלח את הקבצים האלה לבדיקה.

