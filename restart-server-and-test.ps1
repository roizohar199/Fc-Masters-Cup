# סקריפט להפעלה מחדש של השרת ובדיקה

Write-Host "`n==============================================`n" -ForegroundColor Cyan
Write-Host "🔄 Restart Server and Test Forgot-Password" -ForegroundColor Yellow
Write-Host "==============================================`n" -ForegroundColor Cyan

# עצור תהליכי Node.js
Write-Host "1️⃣ Stopping Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✅ Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  No Node.js processes running" -ForegroundColor Gray
}
Write-Host ""

# Build את השרת
Write-Host "2️⃣ Building server..." -ForegroundColor Yellow
Set-Location server
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host ""

# הצג הוראות
Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open 2 PowerShell windows:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Window 1 (Server):" -ForegroundColor Green
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host "  (Keep this window open and watch the logs)" -ForegroundColor Gray
Write-Host ""
Write-Host "Window 2 (Test):" -ForegroundColor Green
Write-Host "  node test-forgot-debug.mjs fcmasters9@gmail.com" -ForegroundColor White
Write-Host "  (Then go back to Window 1 and check the logs)" -ForegroundColor Gray
Write-Host ""
Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "💡 What to look for in server logs:" -ForegroundColor Yellow
Write-Host "  🔑 FORGOT PASSWORD REQUEST START" -ForegroundColor White
Write-Host "  ✅ Validation OK - Email: fcmasters9@gmail.com" -ForegroundColor White
Write-Host "  👤 User FOUND - Status: active" -ForegroundColor White
Write-Host "  🎫 Creating password reset token..." -ForegroundColor White
Write-Host "  📧 Sending password reset email..." -ForegroundColor White
Write-Host "  ✅ Email sent successfully! (או ❌ if failed)" -ForegroundColor White
Write-Host ""
Write-Host "==============================================`n" -ForegroundColor Cyan

# שאל אם להריץ את השרת עכשיו
$response = Read-Host "Start server now in this window? (y/n)"
if ($response -eq 'y') {
    Write-Host "`nStarting server... (Press Ctrl+C to stop)`n" -ForegroundColor Green
    npm start
} else {
    Write-Host "`nOK - Start manually when ready`n" -ForegroundColor Yellow
}

