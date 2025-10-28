#!/bin/bash

# 📧 FC Masters Cup - Quick Email Test
# סקריפט בדיקה מהיר למיילים

echo "📧 FC Masters Cup - Quick Email Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Check if server is running
if ! curl -s http://localhost:8787/api/health > /dev/null 2>&1; then
    print_error "השרת לא פועל! הרץ את השרת קודם"
    exit 1
fi

print_success "השרת פועל"

# Test SMTP connection
print_status "בודק חיבור SMTP..."
SMTP_RESULT=$(curl -s http://localhost:8787/api/admin/smtp/verify)
echo "תוצאת בדיקת SMTP: $SMTP_RESULT"

if echo "$SMTP_RESULT" | grep -q '"ok":true'; then
    print_success "חיבור SMTP תקין!"
else
    print_error "בעיה בחיבור SMTP!"
    echo "פרטי השגיאה: $SMTP_RESULT"
fi

echo ""

# Test email sending
print_status "שולח מייל טסט..."
read -p "הכנס כתובת מייל לטסט: " TEST_EMAIL

if [ -z "$TEST_EMAIL" ]; then
    print_error "לא הוכנסה כתובת מייל"
    exit 1
fi

TEST_RESULT=$(curl -s -X POST http://localhost:8787/api/admin/smtp/test \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$TEST_EMAIL\"}")

echo "תוצאת שליחת מייל: $TEST_RESULT"

if echo "$TEST_RESULT" | grep -q '"ok":true'; then
    print_success "מייל נשלח בהצלחה!"
    print_status "בדוק את תיבת הדואר של $TEST_EMAIL"
else
    print_error "שליחת מייל נכשלה!"
    echo "פרטי השגיאה: $TEST_RESULT"
fi

echo ""

# Check email logs
print_status "בודק לוגי מיילים..."
LOGS_RESULT=$(curl -s http://localhost:8787/api/admin/smtp/email-logs)
echo "לוגי מיילים: $LOGS_RESULT"

echo ""
print_status "בדיקת מיילים הושלמה! 📧"
