#!/bin/bash

# 📧 FC Masters Cup - Email Configuration Test Script
# סקריפט לבדיקת הגדרות המייל החדשות עם Hostinger

echo "📧 FC Masters Cup - Email Configuration Test"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error "קובץ .env לא נמצא!"
    print_status "העתק את env.example ל-.env ועדכן את ההגדרות"
    exit 1
fi

print_success "קובץ .env נמצא"

# Check SMTP configuration
print_status "בודק הגדרות SMTP..."

SMTP_HOST=$(grep "^SMTP_HOST=" .env | cut -d'=' -f2)
SMTP_PORT=$(grep "^SMTP_PORT=" .env | cut -d'=' -f2)
SMTP_USER=$(grep "^SMTP_USER=" .env | cut -d'=' -f2)
SMTP_PASS=$(grep "^SMTP_PASS=" .env | cut -d'=' -f2)
EMAIL_FROM=$(grep "^EMAIL_FROM=" .env | cut -d'=' -f2)
SITE_URL=$(grep "^SITE_URL=" .env | cut -d'=' -f2)

echo "SMTP Host: $SMTP_HOST"
echo "SMTP Port: $SMTP_PORT"
echo "SMTP User: $SMTP_USER"
echo "Email From: $EMAIL_FROM"
echo "Site URL: $SITE_URL"
echo ""

# Validate configuration
if [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = "smtp.gmail.com" ]; then
    print_warning "SMTP_HOST לא מוגדר או עדיין מוגדר ל-Gmail"
    print_status "עדכן ל: SMTP_HOST=smtp.hostinger.com"
fi

if [ -z "$SMTP_USER" ] || [[ "$SMTP_USER" != *"fcmasterscup.com" ]]; then
    print_warning "SMTP_USER לא מוגדר או לא מכיל את הדומיין החדש"
    print_status "עדכן ל: SMTP_USER=noreply@fcmasterscup.com"
fi

if [ -z "$SITE_URL" ] || [[ "$SITE_URL" != *"fcmasterscup.com" ]]; then
    print_warning "SITE_URL לא מוגדר או לא מכיל את הדומיין החדש"
    print_status "עדכן ל: SITE_URL=https://www.fcmasterscup.com"
fi

echo ""
print_status "הגדרות מומלצות ל-Hostinger:"
echo "SMTP_HOST=smtp.hostinger.com"
echo "SMTP_PORT=587"
echo "SMTP_SECURE=false"
echo "SMTP_USER=noreply@fcmasterscup.com"
echo "SMTP_PASS=your-hostinger-email-password"
echo "EMAIL_FROM=noreply@fcmasterscup.com"
echo "SITE_URL=https://www.fcmasterscup.com"
echo ""

# Test SMTP connection if server is running
print_status "בודק חיבור SMTP..."
if curl -s http://localhost:8787/api/admin/smtp/verify > /dev/null 2>&1; then
    print_success "השרת פועל - בודק חיבור SMTP..."
    SMTP_RESULT=$(curl -s http://localhost:8787/api/admin/smtp/verify)
    echo "תוצאת בדיקת SMTP: $SMTP_RESULT"
else
    print_warning "השרת לא פועל - הרץ את השרת לבדיקת SMTP"
fi

echo ""
print_status "צעדים נוספים לפתרון בעיית המיילים:"
echo "1. וודא שחשבון המייל נוצר ב-Hostinger"
echo "2. בדוק את הסיסמה של חשבון המייל"
echo "3. וודא שהדומיין fcmasterscup.com מוגדר ב-Hostinger"
echo "4. בדוק את רשומות ה-DNS (MX, SPF, DKIM)"
echo "5. הרץ את השרת ובדוק את הלוגים"
echo "6. שלח מייל טסט דרך הפאנל הניהול"
echo ""

print_status "לבדיקת לוגי מיילים:"
echo "GET /api/admin/smtp/email-logs"
echo ""

print_status "לשליחת מייל טסט:"
echo "POST /api/admin/smtp/test"
echo 'Body: {"to":"your-email@example.com"}'
echo ""

print_success "בדיקת הגדרות המייל הושלמה! 📧"
