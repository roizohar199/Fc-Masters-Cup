# FC Masters Cup - Email Test Script (PowerShell)
# Script for testing emails on server

Write-Host "FC Masters Cup - Email Test" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking if server is running..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "https://www.fcmasterscup.com/api/health" -Method GET
    Write-Host "Server is running: $($healthResponse.service)" -ForegroundColor Green
} catch {
    Write-Host "Server is not running or not available" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test SMTP configuration (this will show unauthorized, but that's expected)
Write-Host "Checking SMTP settings..." -ForegroundColor Blue
try {
    $smtpResponse = Invoke-RestMethod -Uri "https://www.fcmasterscup.com/api/admin/smtp/verify" -Method GET
    Write-Host "SMTP settings: $smtpResponse" -ForegroundColor Green
} catch {
    Write-Host "Cannot check SMTP settings (admin permissions required)" -ForegroundColor Yellow
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Instructions for manual testing
Write-Host "Manual email testing instructions:" -ForegroundColor Cyan
Write-Host "1. Login to admin panel: https://www.fcmasterscup.com/admin" -ForegroundColor White
Write-Host "2. Login with your admin credentials" -ForegroundColor White
Write-Host "3. Go to 'SMTP Settings' or 'Email Settings' section" -ForegroundColor White
Write-Host "4. Send a test email to yourself" -ForegroundColor White
Write-Host ""

Write-Host "Additional checks:" -ForegroundColor Cyan
Write-Host "- Check spam folder of recipients" -ForegroundColor White
Write-Host "- Verify fcmasterscup@fcmasterscup.com account is active in Hostinger" -ForegroundColor White
Write-Host "- Check DNS records (MX, SPF, DKIM) for the domain" -ForegroundColor White
Write-Host ""

Write-Host "Current SMTP settings:" -ForegroundColor Green
Write-Host "Host: smtp.hostinger.com" -ForegroundColor White
Write-Host "Port: 587" -ForegroundColor White
Write-Host "User: fcmasterscup@fcmasterscup.com" -ForegroundColor White
Write-Host "From: FC Masters Cup <fcmasterscup@fcmasterscup.com>" -ForegroundColor White
Write-Host ""

Write-Host "Server check completed!" -ForegroundColor Green
Write-Host "If emails still don't arrive, check Hostinger settings" -ForegroundColor Yellow
