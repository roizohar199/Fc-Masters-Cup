# בדיקת HOTFIX ל-early-register
Write-Host "Testing Early-Register Hotfix..." -ForegroundColor Green
Write-Host ""

# 1. Ping test - חייב להחזיר JSON
Write-Host "1. Testing /api/early-register/ping..." -ForegroundColor Yellow
$pingUrl = "http://localhost:8787/api/early-register/ping"
try {
    $response = Invoke-WebRequest -Uri $pingUrl -UseBasicParsing
    Write-Host "✓ Ping OK: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Ping FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. POST test - עם debug
Write-Host "2. Testing POST /api/early-register..." -ForegroundColor Yellow
$postUrl = "http://localhost:8787/api/early-register"
$body = '{"tournamentId":1}'
try {
    $response = Invoke-WebRequest -Uri $postUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✓ POST OK: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ POST FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
Write-Host ""

# 3. בדיקת שאפשר לראות בלוגים
Write-Host "3. Check server logs for [EARLY-FIRST] messages:" -ForegroundColor Yellow
Write-Host "   pm2 logs fcmasters --lines 50" -ForegroundColor Cyan
Write-Host ""

Write-Host "Done!" -ForegroundColor Green

