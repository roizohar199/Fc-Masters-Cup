# Fix Backend Port Script
# This script will fix the backend port issue

Write-Host "🔧 Fixing Backend Port Issue..." -ForegroundColor Green

$VPS_HOST = "72.61.179.50"
$VPS_USER = "fcmaster"

Write-Host "📡 Commands to run on server:" -ForegroundColor Blue

$commands = @"
# Check current port configuration
cd /var/www/fcmasters/server
cat .env | grep PORT

# Check if port 8787 is listening
sudo netstat -tuln | grep :8787

# Check PM2 logs
pm2 logs fc-masters --lines 10

# Fix port configuration
echo "PORT=8787" >> .env

# Restart PM2
pm2 restart fc-masters

# Check PM2 status
pm2 status

# Check if port 8787 is now listening
sudo netstat -tuln | grep :8787

# Test the API
curl http://127.0.0.1:8787/api/health || echo "API not responding"
"@

Write-Host $commands -ForegroundColor Gray

Write-Host "`n📋 Manual steps:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host "2. Run the commands above" -ForegroundColor White
Write-Host "3. Check if website works: http://www.k-rstudio.com" -ForegroundColor White

Write-Host "`n✅ Script ready!" -ForegroundColor Green
