#!/bin/bash

# 🚀 FC Masters Cup - Deployment Script
# סקריפט זה מיועד לרוץ על השרת (VPS) לעדכון ידני

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Install server dependencies
print_status "Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install --production
print_success "Server dependencies installed"

# Restart PM2
print_status "Restarting application..."
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
print_success "🎉 Deployment completed successfully!"
echo ""
print_status "Useful commands:"
echo "  - View logs: pm2 logs fc-masters"
echo "  - Restart: pm2 restart fc-masters"
echo "  - Status: pm2 status"
echo ""

