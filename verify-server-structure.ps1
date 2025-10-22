# סקריפט PowerShell לבדיקת מבנה השרת והרשאות
# הרץ את זה בשרת VPS שלך

Write-Host "=== בדיקת מבנה השרת והרשאות ===" -ForegroundColor Green

# בדיקת קיום תיקיות
Write-Host "1. בדיקת קיום תיקיות:" -ForegroundColor Yellow
if (Test-Path "/var/www/fcmasters") {
    Write-Host "✓ /var/www/fcmasters קיים" -ForegroundColor Green
    Get-ChildItem "/var/www/fcmasters" -Force
} else {
    Write-Host "✗ /var/www/fcmasters לא קיים - יוצר עכשיו" -ForegroundColor Red
    sudo mkdir -p /var/www/fcmasters/client/dist /var/www/fcmasters/server
}

if (Test-Path "/var/www/fcmasters/server") {
    Write-Host "✓ /var/www/fcmasters/server קיים" -ForegroundColor Green
} else {
    Write-Host "✗ /var/www/fcmasters/server לא קיים - יוצר עכשיו" -ForegroundColor Red
    sudo mkdir -p /var/www/fcmasters/server
}

if (Test-Path "/var/www/fcmasters/client/dist") {
    Write-Host "✓ /var/www/fcmasters/client/dist קיים" -ForegroundColor Green
} else {
    Write-Host "✗ /var/www/fcmasters/client/dist לא קיים - יוצר עכשיו" -ForegroundColor Red
    sudo mkdir -p /var/www/fcmasters/client/dist
}

# בדיקת הרשאות
Write-Host ""
Write-Host "2. בדיקת הרשאות:" -ForegroundColor Yellow
Write-Host "הרשאות נוכחיות:"
Get-ChildItem "/var/www/fcmasters" -Force

# תיקון הרשאות
Write-Host ""
Write-Host "3. תיקון הרשאות:" -ForegroundColor Yellow
sudo chown -R $env:USER:$env:USER /var/www/fcmasters
Write-Host "✓ הרשאות עודכנו ל-$env:USER:$env:USER" -ForegroundColor Green

# בדיקת PM2
Write-Host ""
Write-Host "4. בדיקת PM2:" -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version
    Write-Host "✓ PM2 מותקן: $pm2Version" -ForegroundColor Green
    Write-Host "תהליכי PM2 נוכחיים:"
    pm2 list
} catch {
    Write-Host "✗ PM2 לא מותקן" -ForegroundColor Red
    Write-Host "התקן PM2 עם: npm install -g pm2" -ForegroundColor Yellow
}

# בדיקת Node.js
Write-Host ""
Write-Host "5. בדיקת Node.js:" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js מותקן: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js לא מותקן" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "✓ npm מותקן: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm לא מותקן" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== סיום בדיקה ===" -ForegroundColor Green
Write-Host "אם הכל בסדר, תוכל להריץ את ה-GitHub Actions workflow החדש" -ForegroundColor Cyan
