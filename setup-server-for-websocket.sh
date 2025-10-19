#!/bin/bash
# סקריפט הכנה חד-פעמי לשרת להפעלת WebSocket
# הרץ סקריפט זה בשרת VPS שלך פעם אחת

set -e

echo "🔧 הכנת שרת VPS לתמיכה ב-WebSocket"
echo "======================================"
echo ""

# בדיקה שאנחנו root או יש sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "⚠️  סקריפט זה דורש הרשאות sudo"
    echo "אנא הרץ עם: sudo ./setup-server-for-websocket.sh"
    exit 1
fi

# 1. הוספת המשתמש ל-sudoers עבור nginx (אם צריך)
echo "📝 שלב 1: הגדרת הרשאות sudo ל-nginx..."

CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=${SUDO_USER:-root}
fi

# בדיקה אם המשתמש כבר יכול להריץ nginx ללא סיסמה
if sudo -l -U $CURRENT_USER 2>/dev/null | grep -q "NOPASSWD.*nginx"; then
    echo "✅ משתמש $CURRENT_USER כבר יכול להריץ nginx ללא סיסמה"
else
    echo "🔐 מוסיף הרשאות nginx ללא סיסמה למשתמש $CURRENT_USER..."
    
    # יצירת קובץ sudoers עבור nginx
    echo "$CURRENT_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /bin/cp * /etc/nginx/sites-available/*" | sudo tee /etc/sudoers.d/nginx-deploy > /dev/null
    sudo chmod 0440 /etc/sudoers.d/nginx-deploy
    
    echo "✅ הרשאות הוגדרו בהצלחה"
fi

# 2. בדיקת קיום nginx
echo ""
echo "📝 שלב 2: בדיקת Nginx..."

if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx לא מותקן!"
    echo "התקן Nginx עם: sudo apt install nginx"
    exit 1
fi

echo "✅ Nginx מותקן (גרסה: $(nginx -v 2>&1 | cut -d'/' -f2))"

# 3. בדיקת תצורת Nginx הנוכחית
echo ""
echo "📝 שלב 3: בדיקת תצורת Nginx..."

if [ -f /etc/nginx/sites-available/fcmasters ]; then
    echo "✅ קובץ תצורה קיים: /etc/nginx/sites-available/fcmasters"
    
    # בדיקה אם יש כבר map directive
    if grep -q "map \$http_upgrade" /etc/nginx/sites-available/fcmasters; then
        echo "✅ Map directive כבר קיים (WebSocket מוגדר)"
    else
        echo "⚠️  Map directive לא קיים - יעודכן בהעלאה הבאה"
    fi
else
    echo "⚠️  קובץ תצורה לא קיים - ייווצר בהעלאה הבאה"
fi

# 4. בדיקת PM2
echo ""
echo "📝 שלב 4: בדיקת PM2..."

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 לא מותקן!"
    echo "התקן PM2 עם: npm install -g pm2"
    exit 1
fi

echo "✅ PM2 מותקן"

# בדיקה אם יש אפליקציה רצה
if pm2 list | grep -q "fc-masters"; then
    echo "✅ אפליקציה fc-masters רצה ב-PM2"
else
    echo "⚠️  אפליקציה fc-masters לא רצה ב-PM2"
fi

# 5. בדיקת פורטים
echo ""
echo "📝 שלב 5: בדיקת פורטים..."

if netstat -tuln 2>/dev/null | grep -q ":8787 "; then
    echo "✅ שרת Node.js מאזין על פורט 8787"
else
    echo "⚠️  פורט 8787 לא פתוח - השרת לא רץ?"
fi

if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    echo "✅ Nginx מאזין על פורט 80"
else
    echo "⚠️  פורט 80 לא פתוח"
fi

# 6. בדיקת firewall
echo ""
echo "📝 שלב 6: בדיקת Firewall..."

if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        echo "🔥 UFW פעיל, בודק כללים..."
        
        if sudo ufw status | grep -q "80"; then
            echo "✅ פורט 80 פתוח"
        else
            echo "⚠️  פורט 80 לא פתוח ב-firewall"
            read -p "לפתוח פורט 80? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo ufw allow 80/tcp
                echo "✅ פורט 80 נפתח"
            fi
        fi
        
        if sudo ufw status | grep -q "443"; then
            echo "✅ פורט 443 פתוח"
        else
            echo "⚠️  פורט 443 לא פתוח (נדרש ל-HTTPS)"
            read -p "לפתוח פורט 443? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo ufw allow 443/tcp
                echo "✅ פורט 443 נפתח"
            fi
        fi
    else
        echo "ℹ️  UFW לא פעיל"
    fi
else
    echo "ℹ️  UFW לא מותקן"
fi

# 7. בדיקת תיקיות
echo ""
echo "📝 שלב 7: בדיקת תיקיות פרויקט..."

if [ -d "/var/www/fcmasters" ]; then
    echo "✅ תיקיית פרויקט קיימת: /var/www/fcmasters"
    
    if [ -d "/var/www/fcmasters/server" ]; then
        echo "✅ תיקיית server קיימת"
    fi
    
    if [ -d "/var/www/fcmasters/client" ]; then
        echo "✅ תיקיית client קיימת"
    fi
else
    echo "⚠️  תיקיית פרויקט לא קיימת: /var/www/fcmasters"
    read -p "ליצור תיקיות? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo mkdir -p /var/www/fcmasters/{server,client}
        sudo chown -R $CURRENT_USER:$CURRENT_USER /var/www/fcmasters
        echo "✅ תיקיות נוצרו"
    fi
fi

# 8. סיכום
echo ""
echo "======================================"
echo "✅ השרת מוכן לתמיכה ב-WebSocket!"
echo "======================================"
echo ""
echo "📋 צעדים הבאים:"
echo ""
echo "1. ודא שהדומיין בקובץ deploy-config-nginx.txt נכון:"
echo "   עדכן את: fcmasters.yourdomain.com לדומיין האמיתי שלך"
echo ""
echo "2. אם יש לך SSL, עדכן את deploy-config-nginx.txt או השתמש ב-deploy-config-nginx-ssl.txt"
echo ""
echo "3. ההעלאה הבאה מ-GitHub Actions תעדכן את Nginx אוטומטית"
echo ""
echo "4. לבדיקה ידנית:"
echo "   - בדוק logs: sudo tail -f /var/log/nginx/error.log"
echo "   - בדוק שהשרת רץ: pm2 status"
echo "   - בדוק WebSocket: השתמש ב-test-websocket.html"
echo ""
echo "🎉 הכל מוכן!"

