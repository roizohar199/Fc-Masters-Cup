#!/bin/bash
# ========================================
# סקריפט להעלאת תצורת Nginx עם SSL ל־k-rstudio.com
# ========================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 תיקון WebSocket + SSL על k-rstudio.com${NC}"
echo "============================================================"
echo ""

# בדיקה שהקובץ קיים
CONFIG_FILE="nginx-config-k-rstudio-ssl.txt"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ שגיאה: הקובץ $CONFIG_FILE לא נמצא!${NC}"
    echo -e "${YELLOW}ודא שאתה בתיקייה הנכונה של הפרויקט.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 סקריפט זה יבצע את הפעולות הבאות:${NC}"
echo "  1. גיבוי התצורה הנוכחית של Nginx"
echo "  2. העלאת התצורה החדשה (עם SSL + WebSocket)"
echo "  3. בדיקת תקינות התצורה"
echo "  4. טעינה מחדש של Nginx"
echo ""

# בקשת פרטי התחברות
echo -e "${CYAN}🔐 הכנס פרטי התחברות לשרת:${NC}"
read -p "שם משתמש SSH (למשל: root): " SERVER_USER
read -p "כתובת השרת (למשל: k-rstudio.com או IP): " SERVER_HOST

if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ]; then
    echo -e "${RED}❌ שגיאה: חובה להזין שם משתמש וכתובת שרת!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  הערה חשובה:${NC}"
echo -e "${YELLOW}   - ודא שיש לך SSL certificate מותקן (Let's Encrypt)${NC}"
echo -e "${YELLOW}   - אם אין לך, הפעל תחילה: sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com${NC}"
echo ""

read -p "האם להמשיך? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ הפעולה בוטלה על ידי המשתמש.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 מתחיל תהליך העלאה...${NC}"

# שלב 1: העלאת הקובץ לשרת
echo ""
echo -e "${CYAN}📤 שלב 1/4: מעלה את התצורה לשרת...${NC}"
echo -e "פקודה: scp $CONFIG_FILE ${SERVER_USER}@${SERVER_HOST}:/tmp/nginx-new-config.txt"

if scp "$CONFIG_FILE" "${SERVER_USER}@${SERVER_HOST}:/tmp/nginx-new-config.txt"; then
    echo -e "${GREEN}✅ הקובץ הועלה בהצלחה!${NC}"
else
    echo -e "${RED}❌ שגיאה בהעלאת הקובץ${NC}"
    echo -e "${YELLOW}ודא שיש לך גישת SSH לשרת.${NC}"
    exit 1
fi

# שלב 2: גיבוי התצורה הנוכחית
echo ""
echo -e "${CYAN}💾 שלב 2/4: יוצר גיבוי של התצורה הנוכחית...${NC}"
BACKUP_NAME="fcmasters.backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_CMD="sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/$BACKUP_NAME"
echo -e "פקודה: $BACKUP_CMD"

if ssh "${SERVER_USER}@${SERVER_HOST}" "$BACKUP_CMD"; then
    echo -e "${GREEN}✅ גיבוי נוצר בהצלחה: $BACKUP_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  אזהרה: לא הצלחתי ליצור גיבוי, אבל ממשיך...${NC}"
fi

# שלב 3: החלפת התצורה
echo ""
echo -e "${CYAN}🔄 שלב 3/4: מעדכן את תצורת Nginx...${NC}"
UPDATE_CMD="sudo cp /tmp/nginx-new-config.txt /etc/nginx/sites-available/fcmasters && sudo nginx -t"
echo -e "פקודה: $UPDATE_CMD"

if ssh "${SERVER_USER}@${SERVER_HOST}" "$UPDATE_CMD"; then
    echo -e "${GREEN}✅ התצורה עודכנה ונבדקה בהצלחה!${NC}"
else
    echo -e "${RED}❌ שגיאה בבדיקת התצורה!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  אפשרויות:${NC}"
    echo -e "${YELLOW}  1. ודא שיש SSL certificate מותקן ב־/etc/letsencrypt/live/k-rstudio.com/${NC}"
    echo -e "${YELLOW}  2. הפעל: sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com${NC}"
    echo -e "${YELLOW}  3. בדוק לוגים: sudo tail -f /var/log/nginx/error.log${NC}"
    echo ""
    echo -e "${CYAN}💡 כדי לשחזר גיבוי: sudo cp /etc/nginx/sites-available/$BACKUP_NAME /etc/nginx/sites-available/fcmasters${NC}"
    exit 1
fi

# שלב 4: טעינה מחדש של Nginx
echo ""
echo -e "${CYAN}🔄 שלב 4/4: טוען מחדש את Nginx...${NC}"
RELOAD_CMD="sudo systemctl reload nginx"
echo -e "פקודה: $RELOAD_CMD"

if ssh "${SERVER_USER}@${SERVER_HOST}" "$RELOAD_CMD"; then
    echo -e "${GREEN}✅ Nginx נטען מחדש בהצלחה!${NC}"
else
    echo -e "${RED}❌ שגיאה בטעינת Nginx${NC}"
    echo -e "${YELLOW}נסה להפעיל ידנית: sudo systemctl restart nginx${NC}"
    exit 1
fi

# סיכום
echo ""
echo "============================================================"
echo -e "${GREEN}🎉 התצורה עודכנה בהצלחה!${NC}"
echo "============================================================"
echo ""
echo -e "${CYAN}✅ מה שהשתנה:${NC}"
echo "  - Nginx עכשיו מאזין על HTTPS (port 443)"
echo "  - WebSocket עובד דרך WSS (מאובטח)"
echo "  - כל התעבורה מ־HTTP מועברת אוטומטית ל־HTTPS"
echo ""
echo -e "${YELLOW}🔍 בדיקות שכדאי לעשות:${NC}"
echo "  1. גלוש ל: https://www.k-rstudio.com"
echo "  2. פתח Console (F12) וחפש: ✅ WebSocket connected successfully"
echo "  3. בדוק שאין שגיאות של SSL"
echo ""
echo -e "${YELLOW}📊 פקודות שימושיות:${NC}"
echo "  - לוגי Nginx:    sudo tail -f /var/log/nginx/error.log"
echo "  - לוגי השרת:     pm2 logs fc-masters"
echo "  - סטטוס Nginx:   sudo systemctl status nginx"
echo "  - סטטוס PM2:     pm2 status"
echo ""
echo -e "${CYAN}💡 אם יש בעיות, קרא את הקובץ: תיקון-WebSocket-SSL.md${NC}"
echo ""

