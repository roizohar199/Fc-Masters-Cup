# Fix project structure - stops server, cleans up, ready to restart
Write-Host "`n=============================================="  -ForegroundColor Cyan
Write-Host "FC Masters Cup - Project Structure Fix" -ForegroundColor Yellow
Write-Host "==============================================`n" -ForegroundColor Cyan

# Check if we're in the root directory
if (-not (Test-Path ".\server" -PathType Container)) {
    Write-Host "ERROR: Run this script from project root directory`n" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Stopping Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    Write-Host "   WARNING: This will stop the server if it's running!" -ForegroundColor Red
    $confirmation = Read-Host "   Continue? (y/n)"
    
    if ($confirmation -eq 'y') {
        $nodeProcesses | Stop-Process -Force
        Write-Host "   OK - All Node.js processes stopped" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "   Cancelled by user`n" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "   OK - No Node.js processes running" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 2: Removing server/server/ directory..." -ForegroundColor Yellow
if (Test-Path ".\server\server" -PathType Container) {
    try {
        Remove-Item -Path ".\server\server" -Recurse -Force -ErrorAction Stop
        Write-Host "   OK - Directory removed" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR - Could not remove directory: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Try manually deleting: .\server\server\" -ForegroundColor Yellow
    }
} else {
    Write-Host "   INFO - Directory does not exist" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 3: Removing scattered test files..." -ForegroundColor Yellow
$filesToDelete = @(
    ".\check-email-logs.js",
    ".\delete-user.js",
    ".\test-api-simple.mjs",
    ".\test-forgot-password.mjs",
    ".\test-forgot-simple.ps1",
    ".\test-presence.js"
)

$deletedCount = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "   OK - Deleted: $file" -ForegroundColor Green
        $deletedCount++
    }
}
if ($deletedCount -eq 0) {
    Write-Host "   INFO - No files to delete" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 4: Removing temporary files..." -ForegroundColor Yellow
$tempCount = 0
Get-ChildItem -Path "." -Filter "~$*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "   OK - Deleted: $($_.Name)" -ForegroundColor Green
    $tempCount++
}
Get-ChildItem -Path "." -Filter "~WRL*.tmp" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "   OK - Deleted: $($_.Name)" -ForegroundColor Green
    $tempCount++
}
if ($tempCount -eq 0) {
    Write-Host "   INFO - No temporary files found" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 5: Removing cleanup scripts..." -ForegroundColor Yellow
$cleanupScripts = @(
    ".\cleanup-project-structure.ps1",
    ".\cleanup-project.ps1"
)
foreach ($script in $cleanupScripts) {
    if (Test-Path $script) {
        Remove-Item -Path $script -Force
        Write-Host "   OK - Deleted: $script" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "Cleanup completed successfully!" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Cyan

Write-Host "Current project structure:" -ForegroundColor Cyan
Write-Host "  FC Masters Cup/" -ForegroundColor White
Write-Host "     client/          (Frontend React app)" -ForegroundColor White
Write-Host "     server/          (Backend Express server)" -ForegroundColor White
Write-Host "        src/          (TypeScript source files)" -ForegroundColor White
Write-Host "        dist/         (Compiled JavaScript)" -ForegroundColor White
Write-Host "        tests/        (Unit tests)" -ForegroundColor White
Write-Host "        *.mjs         (Test/utility scripts)" -ForegroundColor White
Write-Host "        tournaments.sqlite (Database)" -ForegroundColor White
Write-Host "     .env             (Environment variables - CREATE THIS!)" -ForegroundColor Yellow
Write-Host "     *.md             (Documentation)" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create .env file from env.example" -ForegroundColor White
Write-Host "  2. cd server && npm run build" -ForegroundColor White
Write-Host "  3. npm start (to run the server)" -ForegroundColor White
Write-Host "  4. cd ../client && npm run dev (to run the client)" -ForegroundColor White
Write-Host ""

