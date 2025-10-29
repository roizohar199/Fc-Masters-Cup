#!/bin/bash
# Deploy early-register authentication fix

echo "🚀 Deploying early-register fix..."
cd /var/www/fcmasters

# Build server
echo "📦 Building server..."
cd server
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Restart server
echo "🔄 Restarting server..."
pm2 restart fcmasters

# Check logs
echo "📋 Recent logs (last 30 lines):"
pm2 logs fcmasters --lines 30 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test with:"
echo "   curl -i -X POST https://www.fcmasterscup.com/api/early-register \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"tournamentId\":1}'"
echo ""
echo "   (Should return 401 USER_NOT_AUTHENTICATED if not logged in)"
echo "   (Should return 201 with registrationId if logged in)"

