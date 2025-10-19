# סקריפט PowerShell לבדיקת forgot-password ידנית
# 
# שימוש:
# .\test-forgot-password-manual.ps1 -Email "test@example.com" -Port 8787

param(
    [string]$Email = "test@example.com",
    [int]$Port = 8787
)

$baseUrl = "http://localhost:$Port"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 בדיקת Forgot Password ידנית" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📧 Email: $Email" -ForegroundColor White
Write-Host "🌐 Server: $baseUrl" -ForegroundColor White
Write-Host "🕒 Time: $timestamp" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$payload = @{
    email = $Email
} | ConvertTo-Json

Write-Host "📤 Sending POST request..." -ForegroundColor Yellow
Write-Host "📋 Payload:" -ForegroundColor White
Write-Host $payload
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/forgot-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -UseBasicParsing

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📥 Response Received" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📊 Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor White
    Write-Host "📋 Headers:" -ForegroundColor White
    $response.Headers.GetEnumerator() | ForEach-Object {
        Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "📦 Response Body:" -ForegroundColor White
    $responseBody = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host $responseBody -ForegroundColor White
    Write-Host ""

    Write-Host "✅ Request succeeded!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏁 Test Complete" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "💥 Request Failed" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 טיפים:" -ForegroundColor Cyan
    Write-Host "   - ודא שהשרת רץ על $baseUrl" -ForegroundColor White
    Write-Host "   - בדוק את משתני הסביבה (SMTP_*)" -ForegroundColor White
    Write-Host "   - בדוק את הלוגים בשרת" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

