#!/bin/bash
###############################################################################
# סקריפט בדיקת מערכת מיילים בשרת
# 
# שימוש (מ-SSH):
#   bash check-email-on-server.sh
#
# מה זה בודק:
#   1. הגדרות .env
#   2. בדיקת חיבור לפורט SMTP
#   3. לוגי השרת
#   4. טבלת email_logs
###############################################################################

COLORS=true

# Colors
if [ "$COLORS" = true ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    RESET='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    BOLD=''
    RESET=''
fi

section() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${RESET}"
    echo -e "${BOLD}  $1${RESET}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${RESET}"
}

log_success() {
    echo -e "${GREEN}  ✓ $1${RESET}"
}

log_error() {
    echo -e "${RED}  ✗ $1${RESET}"
}

log_warning() {
    echo -e "${YELLOW}  ⚠ $1${RESET}"
}

log_info() {
    echo -e "${CYAN}  → $1${RESET}"
}

###############################################################################
# 1. בדיקת קובץ .env
###############################################################################
section "1️⃣ בדיקת קובץ .env"

if [ ! -f .env ]; then
    log_error "קובץ .env לא נמצא!"
    exit 1
fi

log_success "קובץ .env נמצא"

# בדיקת משתנים
check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$var_value" ]; then
        log_error "${var_name} לא מוגדר"
        return 1
    else
        if [ "$var_name" == "SMTP_PASS" ]; then
            log_success "${var_name}=***${var_value: -4}"
        else
            log_success "${var_name}=${var_value}"
        fi
        return 0
    fi
}

check_env_var "SMTP_HOST"
check_env_var "SMTP_PORT"
check_env_var "SMTP_USER"
check_env_var "SMTP_PASS"
check_env_var "EMAIL_FROM"

# בדיקת ADMIN_EMAILS או ADMIN_EMAIL
ADMIN_EMAILS=$(grep "^ADMIN_EMAILS=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$ADMIN_EMAILS" ] && [ -z "$ADMIN_EMAIL" ]; then
    log_warning "ADMIN_EMAILS לא מוגדר - מנהלים לא יקבלו התראות"
else
    if [ ! -z "$ADMIN_EMAILS" ]; then
        log_success "ADMIN_EMAILS=${ADMIN_EMAILS}"
    else
        log_success "ADMIN_EMAIL=${ADMIN_EMAIL}"
    fi
fi

###############################################################################
# 2. בדיקת חיבור ל-SMTP
###############################################################################
section "2️⃣ בדיקת חיבור ל-SMTP"

SMTP_HOST=$(grep "^SMTP_HOST=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
SMTP_PORT=$(grep "^SMTP_PORT=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -z "$SMTP_HOST" ]; then
    SMTP_HOST="smtp.gmail.com"
fi

if [ -z "$SMTP_PORT" ]; then
    SMTP_PORT="587"
fi

log_info "מתחבר ל-${SMTP_HOST}:${SMTP_PORT}..."

# בדיקה עם openssl (לפורט 587 עם STARTTLS)
if [ "$SMTP_PORT" == "587" ]; then
    if timeout 5 openssl s_client -starttls smtp -crlf -connect ${SMTP_HOST}:${SMTP_PORT} -quiet <<< "QUIT" 2>&1 | grep -q "250"; then
        log_success "חיבור ל-${SMTP_HOST}:${SMTP_PORT} הצליח (STARTTLS)"
    else
        log_error "חיבור ל-${SMTP_HOST}:${SMTP_PORT} נכשל"
        log_warning "הפורט עשוי להיות חסום על ידי הספק"
        log_info "נסה פורט 465 עם SMTP_SECURE=true"
    fi
# בדיקה עם openssl (לפורט 465 עם SSL)
elif [ "$SMTP_PORT" == "465" ]; then
    if timeout 5 openssl s_client -connect ${SMTP_HOST}:${SMTP_PORT} -quiet <<< "QUIT" 2>&1 | grep -q "220"; then
        log_success "חיבור ל-${SMTP_HOST}:${SMTP_PORT} הצליח (SSL)"
    else
        log_error "חיבור ל-${SMTP_HOST}:${SMTP_PORT} נכשל"
    fi
else
    log_warning "פורט ${SMTP_PORT} לא מוכר (587/465 מומלצים)"
fi

###############################################################################
# 3. בדיקת לוגי השרת
###############################################################################
section "3️⃣ לוגי השרת (50 שורות אחרונות)"

if command -v pm2 &> /dev/null; then
    log_info "משתמש ב-PM2..."
    
    # בדיקת SMTP verify בלוגים
    if pm2 logs fc-masters-cup --nostream --lines 100 2>/dev/null | grep -q "SMTP verify OK"; then
        log_success "נמצא 'SMTP verify OK' בלוגים"
    elif pm2 logs fc-masters-cup --nostream --lines 100 2>/dev/null | grep -q "SMTP verify FAILED"; then
        log_error "נמצא 'SMTP verify FAILED' בלוגים"
        echo ""
        pm2 logs fc-masters-cup --nostream --lines 20 | grep -A 2 "SMTP verify FAILED"
    else
        log_warning "לא נמצא לוג SMTP verify (אולי השרת לא הופעל מחדש?)"
    fi
    
    echo ""
    log_info "לוגי מיילים אחרונים:"
    pm2 logs fc-masters-cup --nostream --lines 100 | grep -E "(📧|✅.*mail|❌.*mail)" | tail -10
    
else
    log_warning "PM2 לא מותקן - דלג על בדיקת לוגים"
fi

###############################################################################
# 4. בדיקת טבלת email_logs
###############################################################################
section "4️⃣ טבלת email_logs"

DB_PATH=$(grep "^DB_PATH=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -z "$DB_PATH" ]; then
    DB_PATH="./server/tournaments.sqlite"
fi

if [ ! -f "$DB_PATH" ]; then
    log_error "DB לא נמצא בנתיב: ${DB_PATH}"
else
    log_success "DB נמצא: ${DB_PATH}"
    
    # בדיקת קיום טבלה
    if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='email_logs';" | grep -q "email_logs"; then
        COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM email_logs;")
        log_success "טבלת email_logs קיימת (${COUNT} רשומות)"
        
        if [ "$COUNT" -gt 0 ]; then
            echo ""
            log_info "5 מיילים אחרונים:"
            sqlite3 -header -column "$DB_PATH" "SELECT substr(to_email,1,30) AS to_email, substr(subject,1,40) AS subject, status, created_at FROM email_logs ORDER BY id DESC LIMIT 5;"
        fi
    else
        log_warning "טבלת email_logs לא קיימת (תיווצר בפעם הראשונה ששולחים מייל)"
    fi
fi

###############################################################################
# 5. סיכום והמלצות
###############################################################################
section "✅ סיכום"

log_success "בדיקה הושלמה!"

echo ""
log_info "צעדים הבאים:"
echo "  1. אם יש שגיאות - תקן אותן ב-.env"
echo "  2. הפעל מחדש: pm2 restart fc-masters-cup"
echo "  3. בדוק לוגים: pm2 logs fc-masters-cup --lines 50"
echo "  4. בצע הרשמה/הצטרפות לטורניר ובדוק שהמייל הגיע"
echo "  5. גש ל-https://k-rstudio.com/api/admin/smtp/verify (כמנהל)"
echo "  6. ראה מדריך מפורט: EMAIL-DIAGNOSTICS-GUIDE.md"
echo ""

log_info "בדיקת לוגים בזמן אמת:"
echo "  pm2 logs fc-masters-cup -f --lines 100 | grep -E '(📧|✅|❌|SMTP)'"
echo ""

