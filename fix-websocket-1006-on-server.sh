#!/bin/bash

# ===================================
# Fix WebSocket 1006 Error - Server Script
# ===================================

set -e  # Exit on error

echo "🔧 Starting WebSocket 1006 fix..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===== Step 1: Backup =====
echo -e "${YELLOW}Step 1: Creating backups...${NC}"
BACKUP_DIR="/var/www/fcmasters/backups/websocket-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Nginx config
if [ -f /etc/nginx/sites-available/fcmasters ]; then
    sudo cp /etc/nginx/sites-available/fcmasters "$BACKUP_DIR/nginx-fcmasters.backup"
    echo -e "${GREEN}✓ Nginx config backed up${NC}"
fi

# Backup server code
cp -r /var/www/fcmasters/server/dist "$BACKUP_DIR/server-dist.backup" 2>/dev/null || true
echo -e "${GREEN}✓ Server code backed up to: $BACKUP_DIR${NC}"
echo ""

# ===== Step 2: Pull latest code =====
echo -e "${YELLOW}Step 2: Pulling latest code from Git...${NC}"
cd /var/www/fcmasters

# Check if we have uncommitted changes
if git status --porcelain | grep -q .; then
    echo -e "${RED}Warning: You have uncommitted changes.${NC}"
    echo "Stashing changes..."
    git stash
fi

git pull origin master
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# ===== Step 3: Build server =====
echo -e "${YELLOW}Step 3: Building server...${NC}"
cd /var/www/fcmasters/server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build
npm run build

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}✗ Build failed - dist/index.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Server built successfully${NC}"
echo ""

# ===== Step 4: Update Nginx config =====
echo -e "${YELLOW}Step 4: Updating Nginx configuration...${NC}"

# Check if map directive exists in nginx.conf
if grep -q "map.*connection_upgrade" /etc/nginx/nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓ Map directive already exists in nginx.conf${NC}"
    SKIP_MAP=true
else
    SKIP_MAP=false
fi

# Create new Nginx config
sudo tee /etc/nginx/sites-available/fcmasters > /dev/null << 'EOF'
# Map directive for WebSocket upgrade
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# HTTP → HTTPS Redirect
server {
  listen 80;
  listen [::]:80;
  server_name k-rstudio.com www.k-rstudio.com;
  return 301 https://www.k-rstudio.com$request_uri;
}

# HTTPS Server
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name www.k-rstudio.com k-rstudio.com;

  ssl_certificate     /etc/letsencrypt/live/k-rstudio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/k-rstudio.com/privkey.pem;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  ssl_stapling on;
  ssl_stapling_verify on;
  ssl_trusted_certificate /etc/letsencrypt/live/k-rstudio.com/chain.pem;

  # API Routes
  location ^~ /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
  }

  # WebSocket Presence
  location /presence {
    proxy_pass http://127.0.0.1:8787/presence;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    proxy_buffering off;
  }

  # Uploads
  location /uploads {
    alias /var/www/fcmasters/server/src/uploads;
    add_header Cache-Control "public, max-age=31536000";
    access_log off;
  }

  # Frontend
  root /var/www/fcmasters/client/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "public, max-age=3600";
  }

  # Security Headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # Let's Encrypt
  location /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
    allow all;
  }
}
EOF

# Test Nginx config
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    echo "Restoring backup..."
    sudo cp "$BACKUP_DIR/nginx-fcmasters.backup" /etc/nginx/sites-available/fcmasters
    exit 1
fi

# Reload Nginx
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
echo ""

# ===== Step 5: Restart server =====
echo -e "${YELLOW}Step 5: Restarting server with pm2...${NC}"

# Stop old server
pm2 stop server 2>/dev/null || true

# Delete old process
pm2 delete server 2>/dev/null || true

# Start new server
cd /var/www/fcmasters/server
pm2 start dist/index.js --name server

# Save pm2 configuration
pm2 save

echo -e "${GREEN}✓ Server restarted successfully${NC}"
echo ""

# ===== Step 6: Verification =====
echo -e "${YELLOW}Step 6: Verifying installation...${NC}"
sleep 3

# Check if server is running
if pm2 status | grep -q "server.*online"; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running${NC}"
    pm2 logs server --lines 30
    exit 1
fi

# Check if port 8787 is listening
if sudo netstat -tlnp | grep -q ":8787"; then
    echo -e "${GREEN}✓ Server is listening on port 8787${NC}"
else
    echo -e "${RED}✗ Server is not listening on port 8787${NC}"
    exit 1
fi

# Check Nginx
if sudo systemctl status nginx | grep -q "active (running)"; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ WebSocket fix completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Open browser and navigate to: https://www.k-rstudio.com"
echo "2. Open DevTools (F12) and check Console for:"
echo "   ✓ 'WebSocket connected successfully'"
echo "   ✓ 'Presence update: X users'"
echo "3. Check server logs: pm2 logs server"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""

