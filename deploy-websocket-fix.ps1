# ===================================
# Deploy WebSocket 1006 Fix to Server
# ===================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting WebSocket 1006 fix deployment..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "root@k-rstudio.com"
$PROJECT_DIR = "/var/www/fcmasters"

# ===== Step 1: Commit and push changes =====
Write-Host "Step 1: Committing and pushing changes to Git..." -ForegroundColor Yellow

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected. Committing..." -ForegroundColor Green
    
    git add server/src/index.ts
    git add server/src/presence.ts
    git add nginx-config-websocket-fixed.txt
    git add "תיקון-WebSocket-1006-סופי.md"
    git add fix-websocket-1006-on-server.sh
    git add deploy-websocket-fix.ps1
    
    git commit -m "Fix WebSocket 1006 error with manual upgrade handling"
    git push origin master
    
    Write-Host "✓ Changes committed and pushed" -ForegroundColor Green
} else {
    Write-Host "No changes to commit. Continuing..." -ForegroundColor Yellow
}

Write-Host ""

# ===== Step 2: Upload fix script to server =====
Write-Host "Step 2: Uploading fix script to server..." -ForegroundColor Yellow

# Create temp file with the script
$scriptContent = Get-Content "fix-websocket-1006-on-server.sh" -Raw
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value $scriptContent -NoNewline

# Upload via SCP
Write-Host "Uploading fix-websocket-1006-on-server.sh..." -ForegroundColor Cyan
scp $tempFile "${SERVER}:${PROJECT_DIR}/fix-websocket-1006-on-server.sh"

# Clean up
Remove-Item $tempFile

Write-Host "✓ Script uploaded successfully" -ForegroundColor Green
Write-Host ""

# ===== Step 3: Execute fix script on server =====
Write-Host "Step 3: Executing fix script on server..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  1. Backup current configuration" -ForegroundColor Cyan
Write-Host "  2. Pull latest code from Git" -ForegroundColor Cyan
Write-Host "  3. Build server" -ForegroundColor Cyan
Write-Host "  4. Update Nginx configuration" -ForegroundColor Cyan
Write-Host "  5. Restart server" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Aborted by user." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Connecting to server and executing fix script..." -ForegroundColor Cyan
Write-Host ""

# Execute the script on server
ssh $SERVER "cd $PROJECT_DIR && chmod +x fix-websocket-1006-on-server.sh && ./fix-websocket-1006-on-server.sh"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# ===== Step 4: Verification =====
Write-Host "Step 4: Testing WebSocket connection..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Opening browser to test WebSocket..." -ForegroundColor Cyan
Start-Process "https://www.k-rstudio.com"

Write-Host ""
Write-Host "Please check the following:" -ForegroundColor Yellow
Write-Host "1. Open DevTools (F12) and check Console" -ForegroundColor White
Write-Host "2. Look for: '✅ WebSocket connected successfully'" -ForegroundColor White
Write-Host "3. Look for: '👋 Presence hello: X users'" -ForegroundColor White
Write-Host "4. Verify NO 1006 errors appear" -ForegroundColor White
Write-Host ""

$viewLogs = Read-Host "View server logs? (y/n)"
if ($viewLogs -eq 'y') {
    Write-Host ""
    Write-Host "Fetching server logs..." -ForegroundColor Cyan
    ssh $SERVER "pm2 logs server --lines 50 --nostream"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Summary:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Code committed and pushed to Git" -ForegroundColor Green
Write-Host "✓ Fix script uploaded to server" -ForegroundColor Green
Write-Host "✓ Server rebuilt and restarted" -ForegroundColor Green
Write-Host "✓ Nginx configuration updated" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test WebSocket at: https://www.k-rstudio.com" -ForegroundColor White
Write-Host "2. Monitor logs: ssh $SERVER 'pm2 logs server'" -ForegroundColor White
Write-Host "3. Check Nginx logs: ssh $SERVER 'sudo tail -f /var/log/nginx/error.log'" -ForegroundColor White
Write-Host ""
Write-Host "If issues persist, see: תיקון-WebSocket-1006-סופי.md" -ForegroundColor Cyan
Write-Host ""

