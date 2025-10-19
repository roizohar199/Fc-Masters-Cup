# סקריפט PowerShell לבדיקת מנגנון אישור משתמשים
# מריץ את סקריפט הבדיקה Node.js

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 בודק מנגנון אישור משתמשים..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# בדיקה שאנחנו בתיקייה הנכונה
if (-not (Test-Path "server\test-approval-mechanism.mjs")) {
    Write-Host "❌ שגיאה: הסקריפט חייב לרוץ מתיקיית הפרויקט הראשית!" -ForegroundColor Red
    Write-Host "   נתיב נוכחי: $PWD" -ForegroundColor Yellow
    Write-Host "   צפוי: C:\FC Masters Cup" -ForegroundColor Yellow
    exit 1
}

# מעבר לתיקיית server
Push-Location server

try {
    # הרצת הבדיקה
    node test-approval-mechanism.mjs
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "✅ הבדיקה הושלמה בהצלחה!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    } else {
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        Write-Host "❌ נמצאו שגיאות בבדיקה!" -ForegroundColor Red
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Red
    }
    
    exit $exitCode
}
catch {
    Write-Host "`n❌ שגיאה בהרצת הבדיקה: $_" -ForegroundColor Red
    exit 1
}
finally {
    # חזרה לתיקייה המקורית
    Pop-Location
}

