# Fix Server Script for Hostinger VPS
# This script will fix the backend connection issue

Write-Host "🔧 Fixing Server Connection Issues..." -ForegroundColor Green

# SSH connection details
$VPS_HOST = "72.61.179.50"
$VPS_USER = "fcmaster"

Write-Host "📡 Connecting to server..." -ForegroundColor Blue

# Commands to run on the server
$commands = @"
# Check PM2 status
pm2 status

# Check if port 8787 is listening
sudo netstat -tuln | grep :8787

# Go to server directory
cd /var/www/fcmasters/server

# Check if dist folder exists
ls -la dist/

# Install dependencies
npm install --production

# Start the server
pm2 start dist/index.js --name fc-masters

# Save PM2 configuration
pm2 save

# Check PM2 status again
pm2 status

# Check if port 8787 is now listening
sudo netstat -tuln | grep :8787
"@

Write-Host "🚀 Running commands on server..." -ForegroundColor Blue
Write-Host "Commands to run:" -ForegroundColor Yellow
Write-Host $commands -ForegroundColor Gray

Write-Host "`n📋 Manual steps:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host "2. Run the commands above" -ForegroundColor White
Write-Host "3. Check if website works: http://www.k-rstudio.com" -ForegroundColor White

Write-Host "`n✅ Script ready!" -ForegroundColor Green
