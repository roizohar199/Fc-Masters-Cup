#!/bin/bash

# Fix Server Port Script
# This script will fix the backend port issue on the server

echo "🔧 Fixing Backend Port Issue..."

# Go to server directory
cd /var/www/fcmasters/server

echo "📁 Current directory: $(pwd)"

# Check current .env file
echo "📋 Current .env file:"
cat .env

# Check if PORT is defined
if ! grep -q "PORT=" .env; then
    echo "➕ Adding PORT=8787 to .env"
    echo "PORT=8787" >> .env
else
    echo "✅ PORT already defined in .env"
fi

# Check if HOST is defined
if ! grep -q "HOST=" .env; then
    echo "➕ Adding HOST=0.0.0.0 to .env"
    echo "HOST=0.0.0.0" >> .env
else
    echo "✅ HOST already defined in .env"
fi

# Show updated .env
echo "📋 Updated .env file:"
cat .env

# Check current PM2 status
echo "📊 Current PM2 status:"
pm2 status

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart fc-masters

# Wait a moment
sleep 3

# Check PM2 status again
echo "📊 PM2 status after restart:"
pm2 status

# Check if port 8787 is listening
echo "🔍 Checking if port 8787 is listening:"
sudo netstat -tuln | grep :8787

# Test the API
echo "🧪 Testing API:"
curl -s http://127.0.0.1:8787/api/health || echo "❌ API not responding"

echo "✅ Script completed!"
