# 🚀 FC Masters Cup - GitHub Deployment Setup Script
# סקריפט עזר להגדרת deployment אוטומטי

param(
    [Parameter(Mandatory=$false)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "fcmaster"
)

Write-Host "🚀 FC Masters Cup - GitHub Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git מותקן: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git לא מותקן! הורד מ: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "❌ זו לא תיקיית Git! הרץ קודם: git init" -ForegroundColor Red
    exit 1
}

Write-Host "✅ תיקיית Git נמצאה" -ForegroundColor Green
Write-Host ""

# Step 1: Create SSH Key
Write-Host "📝 שלב 1: יצירת SSH Key" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow

$sshDir = "$HOME\.ssh"
$keyPath = "$sshDir\github_actions_rsa"

if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✅ תיקיית .ssh נוצרה" -ForegroundColor Green
}

if (Test-Path $keyPath) {
    Write-Host "⚠️  SSH Key כבר קיים ב: $keyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "האם ליצור מפתח חדש? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "משתמש במפתח קיים" -ForegroundColor Cyan
    } else {
        Remove-Item $keyPath -Force
        Remove-Item "$keyPath.pub" -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path $keyPath)) {
    Write-Host "יוצר SSH Key..." -ForegroundColor Cyan
    ssh-keygen -t rsa -b 4096 -f $keyPath -N '""' -C "github-actions-fc-masters"
    Write-Host "✅ SSH Key נוצר!" -ForegroundColor Green
}

Write-Host ""

# Step 2: Display Public Key
Write-Host "📝 שלב 2: Public Key להעתקה לשרת" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "העתק את ה-Public Key הזה:" -ForegroundColor Cyan
Write-Host ""
Write-Host "---BEGIN PUBLIC KEY---" -ForegroundColor Green
Get-Content "$keyPath.pub"
Write-Host "---END PUBLIC KEY---" -ForegroundColor Green
Write-Host ""
Write-Host "הוראות להעתקה לשרת:" -ForegroundColor Yellow
Write-Host "1. התחבר לשרת ב-PuTTY" -ForegroundColor White
Write-Host "2. הרץ: mkdir -p ~/.ssh && chmod 700 ~/.ssh" -ForegroundColor White
Write-Host "3. הרץ: nano ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "4. הדבק את ה-Public Key למעלה (שורה חדשה)" -ForegroundColor White
Write-Host "5. שמור: Ctrl+O, Enter, Ctrl+X" -ForegroundColor White
Write-Host "6. הרץ: chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host ""
Read-Host "לחץ Enter כשסיימת להעתיק ל-authorized_keys"

# Step 3: Display Private Key for GitHub
Write-Host ""
Write-Host "📝 שלב 3: Private Key ל-GitHub Secrets" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "העתק את ה-Private Key הזה ל-GitHub:" -ForegroundColor Cyan
Write-Host ""
Write-Host "---BEGIN PRIVATE KEY---" -ForegroundColor Red
Get-Content $keyPath
Write-Host "---END PRIVATE KEY---" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  חשוב: זהו מפתח פרטי - אל תשתף אותו!" -ForegroundColor Red
Write-Host ""

# Copy to clipboard if possible
try {
    Get-Content $keyPath | Set-Clipboard
    Write-Host "✅ Private Key הועתק ל-Clipboard!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  לא ניתן להעתיק אוטומטית - העתק ידנית" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "הוראות להוספה ל-GitHub:" -ForegroundColor Yellow
Write-Host "1. גש ל: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor White
Write-Host "2. לחץ: New repository secret" -ForegroundColor White
Write-Host "3. שם: VPS_SSH_KEY" -ForegroundColor White
Write-Host "4. ערך: הדבק את ה-Private Key המלא מלמעלה" -ForegroundColor White
Write-Host "5. לחץ: Add secret" -ForegroundColor White
Write-Host ""
Read-Host "לחץ Enter כשסיימת להוסיף ל-GitHub Secrets"

# Step 4: Get VPS details
Write-Host ""
Write-Host "📝 שלב 4: פרטי השרת (VPS)" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""

if (-not $VpsIp) {
    $VpsIp = Read-Host "הכנס את ה-IP של השרת (מHostinger)"
}

if (-not $VpsUser) {
    $VpsUser = Read-Host "הכנס את שם המשתמש (ברירת מחדל: fcmaster)"
    if ([string]::IsNullOrWhiteSpace($VpsUser)) {
        $VpsUser = "fcmaster"
    }
}

Write-Host ""
Write-Host "הוסף גם את ה-Secrets האלה ל-GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret Name: VPS_HOST" -ForegroundColor Cyan
Write-Host "Value: $VpsIp" -ForegroundColor White
Write-Host ""
Write-Host "Secret Name: VPS_USER" -ForegroundColor Cyan
Write-Host "Value: $VpsUser" -ForegroundColor White
Write-Host ""
Write-Host "Secret Name: VPS_PORT" -ForegroundColor Cyan
Write-Host "Value: 22" -ForegroundColor White
Write-Host ""
Read-Host "לחץ Enter כשסיימת להוסיף את כל ה-Secrets"

# Step 5: Test SSH Connection
Write-Host ""
Write-Host "📝 שלב 5: בדיקת חיבור SSH" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "בודק חיבור ל-$VpsUser@$VpsIp..." -ForegroundColor Cyan

try {
    $testConnection = ssh -i $keyPath -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VpsUser@$VpsIp" "echo 'Connection successful'"
    if ($testConnection -eq "Connection successful") {
        Write-Host "✅ חיבור SSH עובד!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  חיבור SSH יצר פלט לא צפוי: $testConnection" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ חיבור SSH נכשל!" -ForegroundColor Red
    Write-Host "בדוק:" -ForegroundColor Yellow
    Write-Host "  - שה-IP נכון" -ForegroundColor White
    Write-Host "  - שה-Public Key הועתק לשרת" -ForegroundColor White
    Write-Host "  - שהשרת פועל" -ForegroundColor White
}

# Step 6: Create .env.production
Write-Host ""
Write-Host "📝 שלב 6: יצירת .env.production" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

if (Test-Path ".env.production") {
    Write-Host "⚠️  .env.production כבר קיים" -ForegroundColor Yellow
} else {
    if (Test-Path ".env.production.example") {
        Write-Host "יוצר .env.production מהדוגמה..." -ForegroundColor Cyan
        Copy-Item ".env.production.example" ".env.production"
        Write-Host "✅ .env.production נוצר!" -ForegroundColor Green
        Write-Host "⚠️  ערוך את הקובץ ושנה את הערכים שלך!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.production.example לא נמצא" -ForegroundColor Red
    }
}

# Step 7: Summary
Write-Host ""
Write-Host "🎉 הגדרה הושלמה!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "סיכום מה עשינו:" -ForegroundColor Cyan
Write-Host "  ✅ יצרנו SSH Key" -ForegroundColor White
Write-Host "  ✅ הוספנו Public Key לשרת" -ForegroundColor White
Write-Host "  ✅ הוספנו Secrets ל-GitHub" -ForegroundColor White
Write-Host "  ✅ בדקנו חיבור SSH" -ForegroundColor White
Write-Host "  ✅ יצרנו .env.production" -ForegroundColor White
Write-Host ""
Write-Host "הצעדים הבאים:" -ForegroundColor Yellow
Write-Host "1. ערוך את .env.production עם הערכים שלך" -ForegroundColor White
Write-Host "2. העלה את .env.production לשרת (ב-/var/www/fcmasters/.env)" -ForegroundColor White
Write-Host "3. הרץ: git add . && git commit -m 'Setup deployment' && git push" -ForegroundColor White
Write-Host "4. צפה ב-deployment ב-GitHub Actions!" -ForegroundColor White
Write-Host ""
Write-Host "📖 למידע נוסף: קרא את GITHUB-DEPLOYMENT-SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "בהצלחה! 🚀" -ForegroundColor Green

