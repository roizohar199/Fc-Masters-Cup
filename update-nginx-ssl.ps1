# ========================================
# סקריפט להעלאת תצורת Nginx עם SSL ל־k-rstudio.com
# ========================================

Write-Host "🔧 תיקון WebSocket + SSL על k-rstudio.com" -ForegroundColor Cyan
Write-Host "=" * 60

# בדיקה שהקובץ קיים
$configFile = "nginx-config-k-rstudio-ssl.txt"
if (-not (Test-Path $configFile)) {
    Write-Host "❌ שגיאה: הקובץ $configFile לא נמצא!" -ForegroundColor Red
    Write-Host "ודא שאתה בתיקייה הנכונה של הפרויקט." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 סקריפט זה יבצע את הפעולות הבאות:" -ForegroundColor Yellow
Write-Host "  1. גיבוי התצורה הנוכחית של Nginx"
Write-Host "  2. העלאת התצורה החדשה (עם SSL + WebSocket)"
Write-Host "  3. בדיקת תקינות התצורה"
Write-Host "  4. טעינה מחדש של Nginx"
Write-Host ""

# בקשת פרטי התחברות
Write-Host "🔐 הכנס פרטי התחברות לשרת:" -ForegroundColor Cyan
$serverUser = Read-Host "שם משתמש SSH (למשל: root)"
$serverHost = Read-Host "כתובת השרת (למשל: k-rstudio.com או IP)"

if ([string]::IsNullOrWhiteSpace($serverUser) -or [string]::IsNullOrWhiteSpace($serverHost)) {
    Write-Host "❌ שגיאה: חובה להזין שם משתמש וכתובת שרת!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  הערה חשובה:" -ForegroundColor Yellow
Write-Host "   - ודא שיש לך SSL certificate מותקן (Let's Encrypt)" -ForegroundColor Yellow
Write-Host "   - אם אין לך, הפעל תחילה: sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "האם להמשיך? (Y/N)"
if ($confirm -notmatch '^[Yy]') {
    Write-Host "❌ הפעולה בוטלה על ידי המשתמש." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 מתחיל תהליך העלאה..." -ForegroundColor Green

# שלב 1: העלאת הקובץ לשרת
Write-Host ""
Write-Host "📤 שלב 1/4: מעלה את התצורה לשרת..." -ForegroundColor Cyan
$scpCommand = "scp $configFile ${serverUser}@${serverHost}:/tmp/nginx-new-config.txt"
Write-Host "פקודה: $scpCommand" -ForegroundColor Gray

try {
    & scp $configFile "${serverUser}@${serverHost}:/tmp/nginx-new-config.txt"
    if ($LASTEXITCODE -ne 0) {
        throw "SCP failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ הקובץ הועלה בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בהעלאת הקובץ: $_" -ForegroundColor Red
    Write-Host "ודא שיש לך גישת SSH לשרת." -ForegroundColor Yellow
    exit 1
}

# שלב 2: גיבוי התצורה הנוכחית
Write-Host ""
Write-Host "💾 שלב 2/4: יוצר גיבוי של התצורה הנוכחית..." -ForegroundColor Cyan
$backupCommand = "sudo cp /etc/nginx/sites-available/fcmasters /etc/nginx/sites-available/fcmasters.backup-$(date +%Y%m%d-%H%M%S)"
$sshBackup = "ssh ${serverUser}@${serverHost} `"$backupCommand`""
Write-Host "פקודה: $backupCommand" -ForegroundColor Gray

try {
    ssh "${serverUser}@${serverHost}" "$backupCommand"
    if ($LASTEXITCODE -ne 0) {
        throw "Backup failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ גיבוי נוצר בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  אזהרה: לא הצלחתי ליצור גיבוי, אבל ממשיך..." -ForegroundColor Yellow
}

# שלב 3: החלפת התצורה
Write-Host ""
Write-Host "🔄 שלב 3/4: מעדכן את תצורת Nginx..." -ForegroundColor Cyan
$updateCommand = "sudo cp /tmp/nginx-new-config.txt /etc/nginx/sites-available/fcmasters && sudo nginx -t"
Write-Host "פקודה: $updateCommand" -ForegroundColor Gray

try {
    ssh "${serverUser}@${serverHost}" "$updateCommand"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ שגיאה בבדיקת התצורה!" -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  אפשרויות:" -ForegroundColor Yellow
        Write-Host "  1. ודא שיש SSL certificate מותקן ב־/etc/letsencrypt/live/k-rstudio.com/" -ForegroundColor Yellow
        Write-Host "  2. הפעל: sudo certbot --nginx -d k-rstudio.com -d www.k-rstudio.com" -ForegroundColor Yellow
        Write-Host "  3. בדוק לוגים: sudo tail -f /var/log/nginx/error.log" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 כדי לשחזר גיבוי: sudo cp /etc/nginx/sites-available/fcmasters.backup-* /etc/nginx/sites-available/fcmasters" -ForegroundColor Cyan
        exit 1
    }
    Write-Host "✅ התצורה עודכנה ונבדקה בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בעדכון התצורה: $_" -ForegroundColor Red
    exit 1
}

# שלב 4: טעינה מחדש של Nginx
Write-Host ""
Write-Host "🔄 שלב 4/4: טוען מחדש את Nginx..." -ForegroundColor Cyan
$reloadCommand = "sudo systemctl reload nginx"
Write-Host "פקודה: $reloadCommand" -ForegroundColor Gray

try {
    ssh "${serverUser}@${serverHost}" "$reloadCommand"
    if ($LASTEXITCODE -ne 0) {
        throw "Nginx reload failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ Nginx נטען מחדש בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בטעינת Nginx: $_" -ForegroundColor Red
    Write-Host "נסה להפעיל ידנית: sudo systemctl restart nginx" -ForegroundColor Yellow
    exit 1
}

# סיכום
Write-Host ""
Write-Host "=" * 60
Write-Host "🎉 התצורה עודכנה בהצלחה!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "✅ מה שהשתנה:" -ForegroundColor Cyan
Write-Host "  - Nginx עכשיו מאזין על HTTPS (port 443)" -ForegroundColor White
Write-Host "  - WebSocket עובד דרך WSS (מאובטח)" -ForegroundColor White
Write-Host "  - כל התעבורה מ־HTTP מועברת אוטומטית ל־HTTPS" -ForegroundColor White
Write-Host ""
Write-Host "🔍 בדיקות שכדאי לעשות:" -ForegroundColor Yellow
Write-Host "  1. גלוש ל: https://www.k-rstudio.com" -ForegroundColor White
Write-Host "  2. פתח Console (F12) וחפש: ✅ WebSocket connected successfully" -ForegroundColor White
Write-Host "  3. בדוק שאין שגיאות של SSL" -ForegroundColor White
Write-Host ""
Write-Host "📊 פקודות שימושיות:" -ForegroundColor Yellow
Write-Host "  - לוגי Nginx:    sudo tail -f /var/log/nginx/error.log" -ForegroundColor White
Write-Host "  - לוגי השרת:     pm2 logs fc-masters" -ForegroundColor White
Write-Host "  - סטטוס Nginx:   sudo systemctl status nginx" -ForegroundColor White
Write-Host "  - סטטוס PM2:     pm2 status" -ForegroundColor White
Write-Host ""
Write-Host "💡 אם יש בעיות, קרא את הקובץ: תיקון-WebSocket-SSL.md" -ForegroundColor Cyan
Write-Host ""

