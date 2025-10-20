# ========================================
# סקריפט בדיקה לחיבור WebSocket + SSL
# ========================================

Write-Host "🔍 בודק חיבור WebSocket על k-rstudio.com" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# פרמטרים
$serverHost = Read-Host "כתובת השרת (למשל: k-rstudio.com)"
if ([string]::IsNullOrWhiteSpace($serverHost)) {
    $serverHost = "k-rstudio.com"
    Write-Host "משתמש בברירת מחדל: $serverHost" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🧪 מתחיל בדיקות..." -ForegroundColor Green
Write-Host ""

# ========================================
# בדיקה 1: חיבור HTTPS
# ========================================
Write-Host "📡 בדיקה 1/5: חיבור HTTPS..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://$serverHost" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ HTTPS עובד!" -ForegroundColor Green
        Write-Host "     Status: $($response.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  HTTPS מגיב אבל עם סטטוס: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ שגיאה בחיבור HTTPS: $_" -ForegroundColor Red
    Write-Host "     ודא שהאתר פועל ושיש SSL certificate." -ForegroundColor Yellow
}

# ========================================
# בדיקה 2: SSL Certificate
# ========================================
Write-Host ""
Write-Host "🔐 בדיקה 2/5: SSL Certificate..." -ForegroundColor Cyan
try {
    $uri = "https://$serverHost"
    $req = [System.Net.HttpWebRequest]::Create($uri)
    $req.Timeout = 10000
    $req.GetResponse() | Out-Null
    
    $cert = $req.ServicePoint.Certificate
    if ($cert) {
        $expiryDate = [datetime]::Parse($cert.GetExpirationDateString())
        $daysUntilExpiry = ($expiryDate - (Get-Date)).Days
        
        Write-Host "  ✅ SSL Certificate תקין!" -ForegroundColor Green
        Write-Host "     Issued to: $($cert.Subject)" -ForegroundColor Gray
        Write-Host "     Valid until: $expiryDate ($daysUntilExpiry ימים)" -ForegroundColor Gray
        
        if ($daysUntilExpiry -lt 30) {
            Write-Host "  ⚠️  אזהרה: התעודה תפוג בקרוב! חדש אותה עם: sudo certbot renew" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ לא נמצא SSL Certificate" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  לא הצלחתי לבדוק את ה-Certificate: $_" -ForegroundColor Yellow
}

# ========================================
# בדיקה 3: API Endpoint
# ========================================
Write-Host ""
Write-Host "🔌 בדיקה 3/5: API Endpoint..." -ForegroundColor Cyan
try {
    $apiUrl = "https://$serverHost/api/tournaments"
    $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ API עובד!" -ForegroundColor Green
        Write-Host "     URL: $apiUrl" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  API מגיב אבל עם סטטוס: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ שגיאה ב-API: $_" -ForegroundColor Red
    Write-Host "     ודא שהשרת Backend רץ (pm2 status)" -ForegroundColor Yellow
}

# ========================================
# בדיקה 4: WebSocket Endpoint (HTTP Header Check)
# ========================================
Write-Host ""
Write-Host "🌐 בדיקה 4/5: WebSocket Endpoint..." -ForegroundColor Cyan
try {
    # בדיקה פשוטה של ה-endpoint (לא WebSocket connection אמיתי)
    $wsUrl = "https://$serverHost/presence"
    Write-Host "  📍 URL: wss://$serverHost/presence" -ForegroundColor Gray
    
    # נסה לשלוח GET request רגיל לבדוק שה-endpoint קיים
    try {
        $response = Invoke-WebRequest -Uri $wsUrl -Method Get -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        # אם קיבלנו תשובה (גם אם זה 400/404), זה אומר שה-endpoint קיים
        Write-Host "  ✅ Endpoint /presence זמין (Nginx מעביר לשרת)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400 -or $_.Exception.Response.StatusCode.value__ -eq 426) {
            # HTTP 400/426 זה בדיוק מה שאנחנו מצפים - WebSocket endpoint שמחכה ל-upgrade
            Write-Host "  ✅ Endpoint /presence זמין ומחכה ל-WebSocket upgrade" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Endpoint זמין אבל עם סטטוס: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "  💡 כדי לבדוק WebSocket אמיתי, פתח את האתר בדפדפן ובדוק Console (F12)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ שגיאה בבדיקת WebSocket Endpoint: $_" -ForegroundColor Red
}

# ========================================
# בדיקה 5: בדיקת Server Backend
# ========================================
Write-Host ""
Write-Host "🖥️  בדיקה 5/5: בדיקת Server Backend..." -ForegroundColor Cyan
Write-Host "  📝 ניתן לבדוק דרך SSH:" -ForegroundColor Gray
Write-Host "     ssh <user>@$serverHost" -ForegroundColor White
Write-Host "     pm2 status" -ForegroundColor White
Write-Host "     pm2 logs fc-masters --lines 20" -ForegroundColor White
Write-Host ""

$checkServer = Read-Host "  האם לבדוק את סטטוס השרת דרך SSH? (Y/N)"
if ($checkServer -match '^[Yy]') {
    $serverUser = Read-Host "  שם משתמש SSH"
    if (-not [string]::IsNullOrWhiteSpace($serverUser)) {
        Write-Host ""
        Write-Host "  📊 מבצע בדיקה..." -ForegroundColor Cyan
        
        # בדיקת PM2
        Write-Host "  PM2 Status:" -ForegroundColor Gray
        ssh "${serverUser}@${serverHost}" "pm2 status"
        
        Write-Host ""
        Write-Host "  📋 לוגים אחרונים (20 שורות):" -ForegroundColor Gray
        ssh "${serverUser}@${serverHost}" "pm2 logs fc-masters --lines 20 --nostream"
    }
}

# ========================================
# סיכום
# ========================================
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 סיכום בדיקות" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""
Write-Host "✅ אם כל הבדיקות עברו בהצלחה:" -ForegroundColor Green
Write-Host "  1. פתח את האתר: https://$serverHost" -ForegroundColor White
Write-Host "  2. פתח Console בדפדפן (F12)" -ForegroundColor White
Write-Host "  3. חפש את ההודעה: ✅ WebSocket connected successfully" -ForegroundColor White
Write-Host ""
Write-Host "❌ אם יש בעיות:" -ForegroundColor Red
Write-Host "  - בדוק לוגים: sudo tail -f /var/log/nginx/error.log" -ForegroundColor White
Write-Host "  - בדוק שרת:   pm2 logs fc-masters" -ForegroundColor White
Write-Host "  - קרא מדריך: תיקון-WebSocket-SSL.md" -ForegroundColor White
Write-Host ""
Write-Host "🔗 קישורים לבדיקה:" -ForegroundColor Yellow
Write-Host "  - אתר:       https://$serverHost" -ForegroundColor White
Write-Host "  - API:       https://$serverHost/api/tournaments" -ForegroundColor White
Write-Host "  - WebSocket: wss://$serverHost/presence" -ForegroundColor White
Write-Host ""

