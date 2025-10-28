#!/bin/bash

# 🚀 FC Masters Cup - Advanced Deployment Script with rsync
# סקריפט זה מפרוס את הקוד באמצעות rsync עם החרגות נכונות למסד נתונים

set -e  # Exit on error

echo "🚀 Starting advanced code deployment with rsync..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/fcmasters"
BACKUP_DIR="$PROJECT_DIR/backups"
REMOTE_HOST="${VPS_HOST:-72.61.179.50}"
REMOTE_USER="${VPS_USER:-fcmaster}"

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
if [ ! -d "." ]; then
    print_error "Not in project directory"
    exit 1
fi

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

# Deploy using rsync with proper exclusions
print_status "Deploying code using rsync..."

# Create rsync command with exclusions
rsync -avz --delete \
    --exclude="*.sqlite" \
    --exclude="*.sqlite-shm" \
    --exclude="*.sqlite-wal" \
    --exclude="node_modules/" \
    --exclude=".git/" \
    --exclude=".env" \
    --exclude="server/.env" \
    --exclude="backups/" \
    --exclude="*.log" \
    --exclude=".DS_Store" \
    --exclude="Thumbs.db" \
    --exclude="dist/" \
    ./ "$REMOTE_USER@$REMOTE_HOST:$PROJECT_DIR/"

print_success "Code deployed via rsync"

# Build server code on remote server
print_status "Building server code on remote server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $PROJECT_DIR/server && npm install && npm run build"

# Build client code on remote server
print_status "Building client code on remote server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $PROJECT_DIR/client && npm install && npm run build"

# Clean up any duplicate PM2 processes
print_status "Cleaning up duplicate PM2 processes..."
ssh "$REMOTE_USER@$REMOTE_HOST" "pm2 stop fcmasters 2>/dev/null || true; pm2 delete fcmasters 2>/dev/null || true"

# Restart PM2
print_status "Restarting application..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $PROJECT_DIR/server && pm2 start dist/index.js --name fc-masters && pm2 save"

# Show status
print_status "Current PM2 status:"
ssh "$REMOTE_USER@$REMOTE_HOST" "pm2 status"

echo ""
print_success "🎉 Advanced deployment completed successfully!"
echo ""
print_status "Deployed components:"
echo "  ✅ Server code (server/dist)"
echo "  ✅ Client code (client/dist)"
echo "  ✅ All source files"
echo ""
print_status "Excluded from deployment (preserved on server):"
echo "  🔒 Database files (*.sqlite, *.sqlite-shm, *.sqlite-wal)"
echo "  🔒 Environment files (.env)"
echo "  🔒 Node modules (rebuilt on server)"
echo "  🔒 Backup files"
echo ""
print_status "Useful commands:"
echo "  - View logs: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs fc-masters'"
echo "  - Restart: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 restart fc-masters'"
echo "  - Status: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 status'"
echo ""
