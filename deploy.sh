#!/bin/bash

# 🚀 FC Masters Cup - Code Deployment Script
# סקריפט זה מפרוס רק את קבצי הקוד (server/dist ו-client/dist)
# ⚠️ לא משכתב קונפיגורציות מערכת או קבצי .env

set -e  # Exit on error

echo "🚀 Starting code deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/fcmasters"
BACKUP_DIR="$PROJECT_DIR/backups"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Backup database before deployment
print_status "Creating database backup..."
if [ -f "$PROJECT_DIR/server/tournaments.sqlite" ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sqlite"
    cp "$PROJECT_DIR/server/tournaments.sqlite" "$BACKUP_FILE"
    print_success "Database backed up to: $BACKUP_FILE"
else
    print_status "No database file found, skipping backup"
fi

# Pull latest code from Git (if using git)
if [ -d ".git" ]; then
    print_status "Pulling latest code from Git..."
    git pull origin main || git pull origin master
    print_success "Code updated from Git"
else
    print_status "Not a Git repository, skipping pull"
    print_status "Please upload files manually via SCP/SFTP"
fi

# Build server code
print_status "Building server code..."
cd "$PROJECT_DIR/server"
# Install dependencies for build (if needed)
if [ ! -d "node_modules" ]; then
    npm install
else
    print_status "Dependencies already installed"
fi
# Build TypeScript to dist
npm run build
print_success "Server code built successfully"

# Install production dependencies only
print_status "Installing server production dependencies..."
npm install --production --omit=dev
print_success "Server dependencies installed"

# Build client code
print_status "Building client code..."
cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
    npm install
else
    print_status "Client dependencies already installed"
fi
npm run build
print_success "Client code built successfully"

print_warning "⚠️  Skipping Nginx configuration update (manual config preserved)"
print_warning "⚠️  Skipping .env file update (existing environment preserved)"

# Clean up any duplicate PM2 processes first
print_status "Cleaning up duplicate PM2 processes..."
pm2 stop fcmasters 2>/dev/null || true
pm2 delete fcmasters 2>/dev/null || true
pm2 stop fc-masters-cup 2>/dev/null || true
pm2 delete fc-masters-cup 2>/dev/null || true
pm2 stop fc-masters-backend 2>/dev/null || true
pm2 delete fc-masters-backend 2>/dev/null || true

# Restart PM2
print_status "Restarting application..."
cd "$PROJECT_DIR/server"
pm2 restart fc-masters || pm2 start dist/index.js --name fc-masters
pm2 save
print_success "Application restarted"

# Show status
print_status "Current PM2 status:"
pm2 status

# Clean old backups (keep last 10)
print_status "Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t backup-*.sqlite 2>/dev/null | tail -n +11 | xargs -r rm
print_success "Old backups cleaned"

echo ""
print_success "🎉 Code deployment completed successfully!"
echo ""
print_status "Deployed components:"
echo "  ✅ Server code (server/dist)"
echo "  ✅ Client code (client/dist)"
echo ""
print_status "Preserved configurations:"
echo "  🔒 Nginx configuration (/etc/nginx)"
echo "  🔒 Environment file (.env)"
echo ""
print_status "Useful commands:"
echo "  - View logs: pm2 logs fc-masters"
echo "  - Restart: pm2 restart fc-masters"
echo "  - Status: pm2 status"
echo ""

