module.exports = {
  apps: [
    {
      name: "fcmasters",
      cwd: "/var/www/fcmasters/server",
      script: "dist/index.js",     // ⬅️ PM2 מריץ את הבילד
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
