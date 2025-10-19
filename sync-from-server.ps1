# Sync from Server Script
# This script will pull changes from the server to local project

Write-Host "🔄 Syncing changes from server to local project..." -ForegroundColor Green

$VPS_HOST = "72.61.179.50"
$VPS_USER = "fcmaster"
$LOCAL_PROJECT = "C:\FC Masters Cup"

Write-Host "📡 Connecting to server..." -ForegroundColor Blue

# Create backup of current files
Write-Host "💾 Creating backup of current files..." -ForegroundColor Yellow
$backupDir = "$LOCAL_PROJECT\backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup current .env files
if (Test-Path "$LOCAL_PROJECT\.env") {
    Copy-Item "$LOCAL_PROJECT\.env" "$backupDir\.env.backup"
    Write-Host "✅ Backed up .env"
}

if (Test-Path "$LOCAL_PROJECT\server\.env") {
    Copy-Item "$LOCAL_PROJECT\server\.env" "$backupDir\server.env.backup"
    Write-Host "✅ Backed up server/.env"
}

if (Test-Path "$LOCAL_PROJECT\server\tournaments.sqlite") {
    Copy-Item "$LOCAL_PROJECT\server\tournaments.sqlite" "$backupDir\tournaments.sqlite.backup"
    Write-Host "✅ Backed up tournaments.sqlite"
}

Write-Host "`n📥 Downloading files from server..." -ForegroundColor Blue

# Download .env files
Write-Host "Downloading .env files..."
scp "$VPS_USER@$VPS_HOST:/var/www/fcmasters/.env" "$LOCAL_PROJECT\.env"
scp "$VPS_USER@$VPS_HOST:/var/www/fcmasters/server/.env" "$LOCAL_PROJECT\server\.env"

# Download database
Write-Host "Downloading database..."
scp "$VPS_USER@$VPS_HOST:/var/www/fcmasters/server/tournaments.sqlite" "$LOCAL_PROJECT\server\tournaments.sqlite"

# Download any other important files
Write-Host "Downloading Nginx config..."
scp "$VPS_USER@$VPS_HOST:/etc/nginx/sites-available/fcmasters" "$LOCAL_PROJECT\nginx-config-from-server.txt"

Write-Host "`n✅ Sync completed!" -ForegroundColor Green
Write-Host "📁 Backup saved to: $backupDir" -ForegroundColor Yellow

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the changes" -ForegroundColor White
Write-Host "2. Test locally: npm run dev" -ForegroundColor White
Write-Host "3. Commit changes: git add . && git commit -m 'Sync from server'" -ForegroundColor White
Write-Host "4. Push to GitHub: git push" -ForegroundColor White

Write-Host "`n🔍 Files synced:" -ForegroundColor Cyan
Write-Host "- .env" -ForegroundColor White
Write-Host "- server/.env" -ForegroundColor White
Write-Host "- server/tournaments.sqlite" -ForegroundColor White
Write-Host "- nginx-config-from-server.txt" -ForegroundColor White
