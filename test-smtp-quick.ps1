# ============================================
# Quick SMTP Test - FC Masters Cup
# ============================================

Write-Host "Checking SMTP System..." -ForegroundColor Cyan
Write-Host ""

# Check 1: .env file exists?
Write-Host "1. Checking .env file..." -ForegroundColor Yellow
if (Test-Path "server\.env") {
    Write-Host "   OK - .env exists" -ForegroundColor Green
    
    $envContent = Get-Content "server\.env" -Raw
    
    if ($envContent -match "SMTP_HOST=(.+)") { Write-Host "   SMTP_HOST: $($matches[1])" -ForegroundColor White }
    if ($envContent -match "SMTP_PORT=(\d+)") { Write-Host "   SMTP_PORT: $($matches[1])" -ForegroundColor White }
    if ($envContent -match "SMTP_SECURE=(.+)") { Write-Host "   SMTP_SECURE: $($matches[1])" -ForegroundColor White }
    if ($envContent -match "SMTP_USER=(.+)") { Write-Host "   SMTP_USER: $($matches[1])" -ForegroundColor White }
    if ($envContent -match "EMAIL_FROM=(.+)") { Write-Host "   EMAIL_FROM: $($matches[1])" -ForegroundColor White }
    
    if ($envContent -match "SMTP_PASS=(.{4})") {
        Write-Host "   OK - SMTP_PASS is set" -ForegroundColor Green
    }
}
else {
    Write-Host "   ERROR - .env not found!" -ForegroundColor Red
}

Write-Host ""

# Check 2: email_logs table exists?
Write-Host "2. Checking email_logs table..." -ForegroundColor Yellow
if (Test-Path "server\tournaments.sqlite") {
    Write-Host "   OK - Database exists" -ForegroundColor Green
    Write-Host "   Run migration if needed: Set-Location server; node migrations/run_email_logs_migration.js" -ForegroundColor White
}
else {
    Write-Host "   ERROR - Database not found!" -ForegroundColor Red
}

Write-Host ""

# Check 3: New files exist?
Write-Host "3. Checking SMTP files..." -ForegroundColor Yellow

$files = @(
    "server\src\modules\mail\mailer.ts",
    "server\src\modules\admin\smtp.routes.ts",
    "server\migrations\2025_10_21_email_logs.sql"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   OK - $file" -ForegroundColor Green
    }
    else {
        Write-Host "   ERROR - $file not found!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start server: npm run dev:server" -ForegroundColor White
Write-Host "2. Verify SMTP: GET http://localhost:8787/api/admin/smtp/verify" -ForegroundColor White
Write-Host "3. Test email: POST http://localhost:8787/api/admin/smtp/test" -ForegroundColor White
Write-Host ""
Write-Host "See SMTP-DEBUG-GUIDE.md for details" -ForegroundColor Cyan

