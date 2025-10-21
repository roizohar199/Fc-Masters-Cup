# ==============================================================================
# סקריפט בדיקת מערכת מיילים מרחוק (PowerShell)
# 
# שימוש:
#   .\test-email-remote.ps1
#
# מה זה בודק:
#   1. בדיקת חיבור SMTP דרך API
#   2. שליחת מייל טסט
#   3. צפייה בלוגי מיילים
# ==============================================================================

$Host.UI.RawUI.WindowTitle = "FC Masters Cup - Email Diagnostics"

# הגדרות
$SITE_URL = "https://k-rstudio.com"
$ADMIN_EMAIL = "fcmasters9@gmail.com"

# Colors
function Write-ColorOutput {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('Red','Green','Yellow','Cyan','Magenta','White')]
        [string]$ForegroundColor = 'White'
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-ColorOutput "  $Title" -ForegroundColor White
    Write-ColorOutput "════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

Write-Host ""
Write-ColorOutput "🔍 FC Masters Cup - בדיקת מערכת מיילים מרחוק" -ForegroundColor Cyan
Write-Host ""

# ==============================================================================
# 1. בדיקת חיבור לאתר
# ==============================================================================
Write-Section "1️⃣ בדיקת חיבור לאתר"

try {
    $response = Invoke-WebRequest -Uri "$SITE_URL/api/auth/me" -Method GET -UseBasicParsing -TimeoutSec 10
    Write-ColorOutput "  ✓ האתר זמין ($SITE_URL)" -ForegroundColor Green
} catch {
    Write-ColorOutput "  ✗ לא ניתן להתחבר לאתר: $($_.Exception.Message)" -ForegroundColor Red
    Write-ColorOutput "  → וודא שהאתר זמין: $SITE_URL" -ForegroundColor Yellow
    exit 1
}

# ==============================================================================
# 2. קבלת Session Cookie (התחברות)
# ==============================================================================
Write-Section "2️⃣ התחברות כמנהל"

Write-Host "  → אנא הכנס את פרטי המנהל:" -ForegroundColor Cyan
$email = Read-Host "  אימייל"
$password = Read-Host "  סיסמה" -AsSecureString

# המרת SecureString לטקסט רגיל
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

try {
    $loginBody = @{
        email = $email
        password = $plainPassword
    } | ConvertTo-Json

    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $response = Invoke-WebRequest -Uri "$SITE_URL/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-ColorOutput "  ✓ התחברות הצליחה!" -ForegroundColor Green
    } else {
        throw "Login failed with status $($response.StatusCode)"
    }
} catch {
    Write-ColorOutput "  ✗ התחברות נכשלה: $($_.Exception.Message)" -ForegroundColor Red
    Write-ColorOutput "  → בדוק אימייל וסיסמה" -ForegroundColor Yellow
    exit 1
}

# ==============================================================================
# 3. בדיקת SMTP Verify
# ==============================================================================
Write-Section "3️⃣ בדיקת חיבור SMTP"

try {
    $response = Invoke-WebRequest -Uri "$SITE_URL/api/admin/smtp/verify" -Method GET -WebSession $session -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json

    if ($result.ok) {
        Write-ColorOutput "  ✓ SMTP verify הצליח!" -ForegroundColor Green
        Write-Host "    Host: $($result.host)"
        Write-Host "    Port: $($result.port)"
        Write-Host "    Secure: $($result.secure)"
        Write-Host "    User: $($result.user)"
        Write-Host "    From: $($result.from)"
    } else {
        Write-ColorOutput "  ✗ SMTP verify נכשל: $($result.error)" -ForegroundColor Red
        Write-ColorOutput "  → בדוק הגדרות SMTP ב-.env בשרת" -ForegroundColor Yellow
    }
} catch {
    Write-ColorOutput "  ✗ שגיאה בבדיקת SMTP: $($_.Exception.Message)" -ForegroundColor Red
}

# ==============================================================================
# 4. שליחת מייל טסט
# ==============================================================================
Write-Section "4️⃣ שליחת מייל טסט"

$sendTest = Read-Host "  האם לשלוח מייל טסט? (y/n)"

if ($sendTest -eq 'y' -or $sendTest -eq 'Y') {
    $testEmail = Read-Host "  כתובת לשליחה (ברירת מחדל: $ADMIN_EMAIL)"
    if ([string]::IsNullOrWhiteSpace($testEmail)) {
        $testEmail = $ADMIN_EMAIL
    }

    try {
        $testBody = @{
            to = $testEmail
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$SITE_URL/api/admin/smtp/test" -Method POST -Body $testBody -ContentType "application/json" -WebSession $session -UseBasicParsing
        $result = $response.Content | ConvertFrom-Json

        if ($result.ok) {
            Write-ColorOutput "  ✓ מייל נשלח ל-${testEmail}!" -ForegroundColor Green
            Write-Host "    Message ID: $($result.messageId)"
            Write-ColorOutput "  → בדוק את תיבת המייל (כולל SPAM)" -ForegroundColor Cyan
        } else {
            Write-ColorOutput "  ✗ שליחה נכשלה: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-ColorOutput "  ✗ שגיאה בשליחת טסט: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-ColorOutput "  ⏭  דילוג על שליחת טסט" -ForegroundColor Yellow
}

# ==============================================================================
# 5. צפייה בלוגי מיילים
# ==============================================================================
Write-Section "5️⃣ לוגי מיילים (10 אחרונים)"

try {
    $response = Invoke-WebRequest -Uri "$SITE_URL/api/admin/smtp/email-logs" -Method GET -WebSession $session -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json

    if ($result.items.Count -gt 0) {
        Write-ColorOutput "  נמצאו $($result.items.Count) רשומות:" -ForegroundColor Cyan
        Write-Host ""
        
        $result.items | Select-Object -First 10 | ForEach-Object {
            $icon = if ($_.status -eq 'SENT') { '✅' } else { '❌' }
            $color = if ($_.status -eq 'SENT') { 'Green' } else { 'Red' }
            
            Write-ColorOutput "  $icon [$($_.created_at)] $($_.subject) → $($_.to_email)" -ForegroundColor $color
            if ($_.error) {
                Write-Host "     Error: $($_.error)" -ForegroundColor Red
            }
        }
    } else {
        Write-ColorOutput "  אין רשומות בטבלת email_logs" -ForegroundColor Yellow
        Write-ColorOutput "  → נסה לבצע הרשמה או הצטרפות לטורניר" -ForegroundColor Cyan
    }
} catch {
    Write-ColorOutput "  ✗ שגיאה בקריאת לוגים: $($_.Exception.Message)" -ForegroundColor Red
}

# ==============================================================================
# 6. סיכום
# ==============================================================================
Write-Section "✅ סיכום"

Write-ColorOutput "  בדיקה הושלמה!" -ForegroundColor Green
Write-Host ""
Write-ColorOutput "  צעדים הבאים:" -ForegroundColor Cyan
Write-Host "    1. אם יש שגיאות - בדוק .env בשרת"
Write-Host "    2. וודא ש-SMTP_PASS הוא App Password (16 תווים)"
Write-Host "    3. בדוק שהמייל הגיע (כולל SPAM)"
Write-Host "    4. בצע הרשמה/הצטרפות ובדוק שמגיעות התראות"
Write-Host "    5. ראה מדריך מפורט: EMAIL-DIAGNOSTICS-GUIDE.md"
Write-Host ""

Read-Host "לחץ Enter לסיום..."

