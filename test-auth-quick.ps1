# Quick Auth Test - FC Masters Cup

Write-Host "Checking Auth System..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Migration files
Write-Host "1. Checking migration files..." -ForegroundColor Yellow
if (Test-Path "server\migrations\2025_10_21_auth_improvements.sql") {
    Write-Host "   OK - Migration file exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - Migration file not found!" -ForegroundColor Red
}

Write-Host ""

# Check 2: Updated files
Write-Host "2. Checking updated files..." -ForegroundColor Yellow

if (Test-Path "server\src\models.ts") {
    Write-Host "   OK - server\src\models.ts exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - server\src\models.ts not found!" -ForegroundColor Red
}

if (Test-Path "server\src\routes\auth.ts") {
    Write-Host "   OK - server\src\routes\auth.ts exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - server\src\routes\auth.ts not found!" -ForegroundColor Red
}

if (Test-Path "client\src\pages\Login.tsx") {
    Write-Host "   OK - client\src\pages\Login.tsx exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - client\src\pages\Login.tsx not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start server: npm run dev:server" -ForegroundColor White
Write-Host "2. Try registration with invalid data" -ForegroundColor White
Write-Host "3. Try registration with short PSN name" -ForegroundColor White
Write-Host "4. Try registering twice with same email" -ForegroundColor White
Write-Host ""
Write-Host "See AUTH-REGISTRATION-FIX.md for details" -ForegroundColor Cyan

