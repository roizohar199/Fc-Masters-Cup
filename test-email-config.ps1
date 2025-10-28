# 📧 FC Masters Cup - Email Configuration Test Script (PowerShell)
# סקריפט לבדיקת הגדרות המייל החדשות עם Hostinger

Write-Host "📧 FC Masters Cup - Email Configuration Test" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ קובץ .env לא נמצא!" -ForegroundColor Red
    Write-Host "העתק את env.example ל-.env ועדכן את ההגדרות" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ קובץ .env נמצא" -ForegroundColor Green

# Read .env file
$envContent = Get-Content ".env"

# Extract SMTP configuration
$SMTP_HOST = ($envContent | Where-Object { $_ -match "^SMTP_HOST=" }) -replace "SMTP_HOST=", ""
$SMTP_PORT = ($envContent | Where-Object { $_ -match "^SMTP_PORT=" }) -replace "SMTP_PORT=", ""
$SMTP_USER = ($envContent | Where-Object { $_ -match "^SMTP_USER=" }) -replace "SMTP_USER=", ""
$SMTP_PASS = ($envContent | Where-Object { $_ -match "^SMTP_PASS=" }) -replace "SMTP_PASS=", ""
$EMAIL_FROM = ($envContent | Where-Object { $_ -match "^EMAIL_FROM=" }) -replace "EMAIL_FROM=", ""
$SITE_URL = ($envContent | Where-Object { $_ -match "^SITE_URL=" }) -replace "SITE_URL=", ""

Write-Host "📋 הגדרות SMTP נוכחיות:" -ForegroundColor Blue
Write-Host "SMTP Host: $SMTP_HOST"
Write-Host "SMTP Port: $SMTP_PORT"
Write-Host "SMTP User: $SMTP_USER"
Write-Host "Email From: $EMAIL_FROM"
Write-Host "Site URL: $SITE_URL"
Write-Host ""

# Validate configuration
$issues = @()

if ([string]::IsNullOrWhiteSpace($SMTP_HOST) -or $SMTP_HOST -eq "smtp.gmail.com") {
    $issues += "SMTP_HOST לא מוגדר או עדיין מוגדר ל-Gmail"
}

if ([string]::IsNullOrWhiteSpace($SMTP_USER) -or $SMTP_USER -notlike "*fcmasterscup.com*") {
    $issues += "SMTP_USER לא מוגדר או לא מכיל את הדומיין החדש"
}

if ([string]::IsNullOrWhiteSpace($SITE_URL) -or $SITE_URL -notlike "*fcmasterscup.com*") {
    $issues += "SITE_URL לא מוגדר או לא מכיל את הדומיין החדש"
}

if ($issues.Count -gt 0) {
    Write-Host "⚠️  בעיות שנמצאו:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "📝 הגדרות מומלצות ל-Hostinger:" -ForegroundColor Green
Write-Host "SMTP_HOST=smtp.hostinger.com"
Write-Host "SMTP_PORT=587"
Write-Host "SMTP_SECURE=false"
Write-Host "SMTP_USER=noreply@fcmasterscup.com"
Write-Host "SMTP_PASS=your-hostinger-email-password"
Write-Host "EMAIL_FROM=noreply@fcmasterscup.com"
Write-Host "SITE_URL=https://www.fcmasterscup.com"
Write-Host ""

# Test SMTP connection if server is running
Write-Host "🔍 בודק חיבור SMTP..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8787/api/admin/smtp/verify" -Method GET -TimeoutSec 5
    Write-Host "✅ השרת פועל - תוצאת בדיקת SMTP:" -ForegroundColor Green
    Write-Host $response -ForegroundColor White
} catch {
    Write-Host "⚠️  השרת לא פועל או לא זמין" -ForegroundColor Yellow
    Write-Host "הרץ את השרת לבדיקת SMTP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 צעדים נוספים לפתרון בעיית המיילים:" -ForegroundColor Cyan
Write-Host "1. וודא שחשבון המייל נוצר ב-Hostinger" -ForegroundColor White
Write-Host "2. בדוק את הסיסמה של חשבון המייל" -ForegroundColor White
Write-Host "3. וודא שהדומיין fcmasterscup.com מוגדר ב-Hostinger" -ForegroundColor White
Write-Host "4. בדוק את רשומות ה-DNS (MX, SPF, DKIM)" -ForegroundColor White
Write-Host "5. הרץ את השרת ובדוק את הלוגים" -ForegroundColor White
Write-Host "6. שלח מייל טסט דרך הפאנל הניהול" -ForegroundColor White
Write-Host ""

Write-Host "🔧 פקודות לבדיקה:" -ForegroundColor Cyan
Write-Host "לבדיקת לוגי מיילים: GET /api/admin/smtp/email-logs" -ForegroundColor White
Write-Host "לשליחת מייל טסט: POST /api/admin/smtp/test" -ForegroundColor White
Write-Host 'Body: {"to":"your-email@example.com"}' -ForegroundColor White
Write-Host ""

Write-Host "✅ בדיקת הגדרות המייל הושלמה! 📧" -ForegroundColor Green
