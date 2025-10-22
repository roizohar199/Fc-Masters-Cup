#!/bin/bash

# סקריפט לבדיקת מבנה השרת והרשאות
# הרץ את זה בשרת VPS שלך

echo "=== בדיקת מבנה השרת והרשאות ==="

# בדיקת קיום תיקיות
echo "1. בדיקת קיום תיקיות:"
if [ -d "/var/www/fcmasters" ]; then
    echo "✓ /var/www/fcmasters קיים"
    ls -la /var/www/fcmasters/
else
    echo "✗ /var/www/fcmasters לא קיים - יוצר עכשיו"
    sudo mkdir -p /var/www/fcmasters/client/dist /var/www/fcmasters/server
fi

if [ -d "/var/www/fcmasters/server" ]; then
    echo "✓ /var/www/fcmasters/server קיים"
else
    echo "✗ /var/www/fcmasters/server לא קיים - יוצר עכשיו"
    sudo mkdir -p /var/www/fcmasters/server
fi

if [ -d "/var/www/fcmasters/client/dist" ]; then
    echo "✓ /var/www/fcmasters/client/dist קיים"
else
    echo "✗ /var/www/fcmasters/client/dist לא קיים - יוצר עכשיו"
    sudo mkdir -p /var/www/fcmasters/client/dist
fi

# בדיקת הרשאות
echo ""
echo "2. בדיקת הרשאות:"
echo "הרשאות נוכחיות:"
ls -la /var/www/fcmasters/

# תיקון הרשאות
echo ""
echo "3. תיקון הרשאות:"
sudo chown -R $USER:$USER /var/www/fcmasters
echo "✓ הרשאות עודכנו ל-$USER:$USER"

# בדיקת PM2
echo ""
echo "4. בדיקת PM2:"
if command -v pm2 >/dev/null 2>&1; then
    echo "✓ PM2 מותקן"
    echo "תהליכי PM2 נוכחיים:"
    pm2 list
else
    echo "✗ PM2 לא מותקן"
    echo "התקן PM2 עם: npm install -g pm2"
fi

# בדיקת Node.js
echo ""
echo "5. בדיקת Node.js:"
if command -v node >/dev/null 2>&1; then
    echo "✓ Node.js מותקן: $(node --version)"
else
    echo "✗ Node.js לא מותקן"
fi

if command -v npm >/dev/null 2>&1; then
    echo "✓ npm מותקן: $(npm --version)"
else
    echo "✗ npm לא מותקן"
fi

echo ""
echo "=== סיום בדיקה ==="
echo "אם הכל בסדר, תוכל להריץ את ה-GitHub Actions workflow החדש"
