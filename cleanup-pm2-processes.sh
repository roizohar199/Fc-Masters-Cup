#!/bin/bash
# 🧹 FC Masters Cup - PM2 Process Cleanup Script
# סקריפט זה מנקה תהליכי PM2 מיותרים ומשאיר רק את fc-masters

set -e

echo "🧹 מתחיל ניקוי תהליכי PM2..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_gray() {
    echo -e "${GRAY}[INFO]${NC} $1"
}

# רשימת תהליכים לעצירה (כל השמות הלא נכונים)
processes_to_stop=(
    "fc-masters"
    "fc-masters-cup"
    "fc-masters-backend"
    "fc-masters-cup-backend"
)

print_status "בודק תהליכי PM2 נוכחיים..."

# בדיקה אם PM2 מותקן
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 לא מותקן או לא זמין"
    print_warning "התקן PM2 עם: npm install -g pm2"
    exit 1
fi

print_success "PM2 זמין"

# עצירת תהליכים מיותרים
for process_name in "${processes_to_stop[@]}"; do
    print_info "בודק תהליך: $process_name"
    
    if pm2 list | grep -q "$process_name"; then
        print_warning "עוצר תהליך: $process_name"
        pm2 stop "$process_name" || true
        pm2 delete "$process_name" || true
        print_success "תהליך $process_name נעצר ונמחק"
    else
        print_gray "תהליך $process_name לא קיים"
    fi
done

# וידוא ש-fcmasters רץ
print_info "בודק תהליך fcmasters..."

if pm2 list | grep -q "fcmasters"; then
    print_success "תהליך fcmasters קיים"
    
    # בדיקה אם הוא רץ
    if pm2 list | grep "fcmasters" | grep -q "online"; then
        print_success "תהליך fcmasters רץ"
    else
        print_warning "תהליך fcmasters לא רץ - מפעיל מחדש"
        pm2 restart fcmasters
    fi
else
    print_error "תהליך fcmasters לא קיים!"
    print_warning "יוצר תהליך fcmasters חדש..."
    
    # בדיקה אם קיים קובץ dist
    if [ -f "server/dist/index.js" ]; then
        pm2 start server/dist/index.js --name fcmasters
        print_success "תהליך fcmasters נוצר"
    else
        print_error "קובץ server/dist/index.js לא קיים!"
        print_warning "הרץ קודם: npm run build"
    fi
fi

# שמירת תצורת PM2
print_status "שומר תצורת PM2..."
pm2 save

# הצגת סטטוס סופי
print_status "סטטוס PM2 סופי:"
pm2 list

echo ""
print_success "🎉 ניקוי PM2 הושלם!"
print_success "✅ רק תהליך fcmasters אמור לרוץ עכשיו"
echo ""
print_info "פקודות שימושיות:"
echo "  - צפה בלוגים: pm2 logs fcmasters"
echo "  - הפעל מחדש: pm2 restart fcmasters"
echo "  - סטטוס: pm2 status"
echo "  - עצור: pm2 stop fcmasters"
