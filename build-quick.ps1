# Quick build script for FC Masters Cup project
# This script only runs npm run build (assumes dependencies are already installed)

Write-Host "Quick build process for FC Masters Cup..." -ForegroundColor Green
Write-Host ""

# Get the script directory (project root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerPath = Join-Path $ProjectRoot "server"
$ClientPath = Join-Path $ProjectRoot "client"

# Function to run npm build in a directory
function Quick-Build-Project {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Building $Name..." -ForegroundColor Yellow
    
    # Check if directory exists
    if (-not (Test-Path $Path)) {
        Write-Host "Error: Directory $Path does not exist!" -ForegroundColor Red
        return $false
    }
    
    # Change to the project directory
    Push-Location $Path
    
    try {
        # Run npm run build
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
$ServerSuccess = Quick-Build-Project -Path $ServerPath -Name "Server"

# Build client
$ClientSuccess = Quick-Build-Project -Path $ClientPath -Name "Client"

Write-Host ""

# Summary
if ($ServerSuccess -and $ClientSuccess) {
    Write-Host "All projects built successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some builds failed. Check the errors above." -ForegroundColor Red
    exit 1
}
