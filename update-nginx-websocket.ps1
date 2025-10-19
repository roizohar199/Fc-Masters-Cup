# סקריפט להעלאת תצורת Nginx עם תמיכה ב-WebSocket
# 
# שימוש:
# .\update-nginx-websocket.ps1 -ServerIP "your-server-ip" -ServerUser "root"
# .\update-nginx-websocket.ps1 -ServerIP "your-server-ip" -UseSSL  # עם HTTPS/SSL

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$NginxConfigPath = "/etc/nginx/sites-available/fcmasters",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseSSL = $false
)

Write-Host "🔌 העלאת תצורת Nginx עם תמיכה ב-WebSocket" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה אם ServerIP לא סופק
if ([string]::IsNullOrWhiteSpace($ServerIP)) {
    Write-Host "❌ שגיאה: חובה לציין כתובת IP של השרת" -ForegroundColor Red
    Write-Host ""
    Write-Host "דוגמת שימוש:" -ForegroundColor Yellow
    Write-Host ".\update-nginx-websocket.ps1 -ServerIP `"123.456.789.012`"" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# בחירת קובץ תצורה
if ($UseSSL) {
    $configFile = "deploy-config-nginx-ssl.txt"
    Write-Host "🔒 משתמש בתצורת HTTPS/SSL" -ForegroundColor Cyan
} else {
    $configFile = "deploy-config-nginx.txt"
    Write-Host "🌐 משתמש בתצורת HTTP" -ForegroundColor Cyan
}

# בדיקת קיום קובץ התצורה
if (-not (Test-Path $configFile)) {
    Write-Host "❌ שגיאה: קובץ $configFile לא נמצא" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 פרטי חיבור:" -ForegroundColor Green
Write-Host "  שרת: $ServerIP"
Write-Host "  משתמש: $ServerUser"
Write-Host "  נתיב Nginx: $NginxConfigPath"
Write-Host "  תצורה: $configFile"
if ($UseSSL) {
    Write-Host "  SSL/HTTPS: מופעל ✅" -ForegroundColor Green
} else {
    Write-Host "  SSL/HTTPS: כבוי (HTTP בלבד)" -ForegroundColor Yellow
}
Write-Host ""

# שאלה לאישור
$confirmation = Read-Host "האם להמשיך? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ בוטל על ידי המשתמש" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 מעלה קובץ תצורה לשרת..." -ForegroundColor Cyan

# העלאת הקובץ לשרת
try {
    scp $configFile "${ServerUser}@${ServerIP}:/tmp/nginx-config.txt"
    if ($LASTEXITCODE -ne 0) {
        throw "העלאת הקובץ נכשלה"
    }
    Write-Host "✅ קובץ הועלה בהצלחה" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בהעלאת הקובץ: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💾 יוצר גיבוי של התצורה הקיימת..." -ForegroundColor Cyan

# יצירת גיבוי והחלפת התצורה
$backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$commands = @"
# גיבוי התצורה הקיימת
sudo cp $NginxConfigPath ${NginxConfigPath}.backup-${backupDate}

# החלפת התצורה
sudo cp /tmp/nginx-config.txt $NginxConfigPath

# בדיקת תקינות
sudo nginx -t
"@

try {
    $commands | ssh "${ServerUser}@${ServerIP}" "bash -s"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ בדיקת תקינות נכשלה! משחזר גיבוי..." -ForegroundColor Red
        
        # שחזור הגיבוי
        ssh "${ServerUser}@${ServerIP}" "sudo cp ${NginxConfigPath}.backup-${backupDate} $NginxConfigPath"
        
        Write-Host "✅ גיבוי שוחזר בהצלחה" -ForegroundColor Yellow
        Write-Host "❌ אנא בדוק את קובץ התצורה ונסה שוב" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ תצורה עודכנה ונבדקה בהצלחה" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 טוען מחדש את Nginx..." -ForegroundColor Cyan

try {
    ssh "${ServerUser}@${ServerIP}" "sudo systemctl reload nginx"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Reload נכשל, מנסה restart..." -ForegroundColor Yellow
        ssh "${ServerUser}@${ServerIP}" "sudo systemctl restart nginx"
    }
    
    Write-Host "✅ Nginx נטען מחדש בהצלחה" -ForegroundColor Green
} catch {
    Write-Host "❌ שגיאה בטעינת Nginx: $_" -ForegroundColor Red
    Write-Host "💡 נסה להריץ ידנית: sudo systemctl restart nginx" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 בדיקת סטטוס..." -ForegroundColor Cyan

try {
    ssh "${ServerUser}@${ServerIP}" "sudo systemctl status nginx --no-pager -l"
} catch {
    Write-Host "⚠️ לא ניתן להציג סטטוס" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ תצורת Nginx עודכנה בהצלחה!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 מידע נוסף:" -ForegroundColor Cyan
Write-Host "  - גיבוי נשמר ב: ${NginxConfigPath}.backup-${backupDate}"
Write-Host "  - WebSocket מופעל עבור: /presence"
Write-Host "  - תמיכה ב-WebSocket גם דרך: /api"
Write-Host ""
Write-Host "🧪 בדיקת WebSocket:" -ForegroundColor Cyan
Write-Host "  פתח את האתר שלך, לחץ F12 (Console), והרץ:"
if ($UseSSL) {
    Write-Host "  const ws = new WebSocket('wss://fcmasters.yourdomain.com/presence');" -ForegroundColor Yellow
} else {
    Write-Host "  const ws = new WebSocket('ws://fcmasters.yourdomain.com/presence');" -ForegroundColor Yellow
}
Write-Host "  ws.onopen = () => console.log('✅ Connected!');" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 לוגים:" -ForegroundColor Cyan
Write-Host "  Nginx errors: ssh $ServerUser@$ServerIP 'sudo tail -f /var/log/nginx/error.log'" -ForegroundColor Gray
Write-Host "  Server logs: ssh $ServerUser@$ServerIP 'sudo journalctl -u fcmasters -f'" -ForegroundColor Gray
Write-Host ""

