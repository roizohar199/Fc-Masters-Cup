# Build Scripts for FC Masters Cup

This directory contains build scripts to compile both the server and client projects.

## Available Scripts

### PowerShell Scripts (Windows)

1. **`build-all.ps1`** - Complete build process
   - Runs `npm install` to ensure dependencies are up to date
   - Runs `npm run build` for both server and client
   - Provides detailed output and error handling
   - Usage: `.\build-all.ps1`

2. **`build-quick.ps1`** - Quick build process
   - Only runs `npm run build` (assumes dependencies are already installed)
   - Faster execution
   - Usage: `.\build-quick.ps1`

### Bash Script (Linux/Mac)

1. **`build-all.sh`** - Complete build process for Unix systems
   - Runs `npm install` to ensure dependencies are up to date
   - Runs `npm run build` for both server and client
   - Usage: `./build-all.sh`

## Project Structure

The scripts expect the following structure:
```
FC Masters Cup/
├── server/          # Server project (TypeScript)
├── client/          # Client project (React + Vite)
├── build-all.ps1    # PowerShell build script
├── build-quick.ps1  # PowerShell quick build script
└── build-all.sh     # Bash build script
```

## Requirements

- Node.js (version 20 or higher)
- npm
- PowerShell (for .ps1 scripts)
- Bash (for .sh script)

## Exit Codes

- `0` - All builds successful
- `1` - One or more builds failed

## Notes

- The scripts automatically detect the project root directory
- All scripts provide colored output for better readability
- Error handling includes detailed messages for troubleshooting
- The complete build scripts (`build-all.*`) are recommended for production builds
- The quick build script (`build-quick.ps1`) is useful for development when dependencies haven't changed
