# Build script for FC Masters Cup project
# This script builds both server and client projects

Write-Host "Starting build process for FC Masters Cup..." -ForegroundColor Green
Write-Host ""

# Get the script directory (project root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerPath = Join-Path $ProjectRoot "server"
$ClientPath = Join-Path $ProjectRoot "client"

# Function to run npm build in a directory
function Build-Project {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Building $Name..." -ForegroundColor Yellow
    Write-Host "   Path: $Path" -ForegroundColor Gray
    
    # Check if directory exists
    if (-not (Test-Path $Path)) {
        Write-Host "Error: Directory $Path does not exist!" -ForegroundColor Red
        return $false
    }
    
    # Check if package.json exists
    $PackageJsonPath = Join-Path $Path "package.json"
    if (-not (Test-Path $PackageJsonPath)) {
        Write-Host "Error: package.json not found in $Path!" -ForegroundColor Red
        return $false
    }
    
    # Change to the project directory
    Push-Location $Path
    
    try {
        # Run npm install first to ensure dependencies are up to date
        Write-Host "   Installing dependencies..." -ForegroundColor Cyan
        $InstallResult = npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: npm install failed for $Name" -ForegroundColor Red
            return $false
        }
        
        # Run npm run build
        Write-Host "   Running build..." -ForegroundColor Cyan
        $BuildResult = npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: npm run build failed for $Name" -ForegroundColor Red
            return $false
        }
        
        Write-Host "$Name built successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error building $Name : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Build server
Write-Host "Building Server..." -ForegroundColor Magenta
$ServerSuccess = Build-Project -Path $ServerPath -Name "Server"

Write-Host ""

# Build client
Write-Host "Building Client..." -ForegroundColor Magenta
$ClientSuccess = Build-Project -Path $ClientPath -Name "Client"

Write-Host ""

# Summary
Write-Host "Build Summary:" -ForegroundColor Blue
if ($ServerSuccess) {
    Write-Host "   Server: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "   Server: FAILED" -ForegroundColor Red
}

if ($ClientSuccess) {
    Write-Host "   Client: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "   Client: FAILED" -ForegroundColor Red
}

Write-Host ""

if ($ServerSuccess -and $ClientSuccess) {
    Write-Host "All projects built successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some builds failed. Check the errors above." -ForegroundColor Red
    exit 1
}
