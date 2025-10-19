// טען .env לפני הכל
import { loadEnvSafely } from "./loadEnv.js";
loadEnvSafely();

console.log("ENV check → HOST:", process.env.SMTP_HOST, "| USER:", process.env.SMTP_USER, "| FROM:", process.env.EMAIL_FROM);

import express from "express";
import cors from "cors";
import path from "node:path";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { tournaments } from "./routes/tournaments.js";
import { matches } from "./routes/matches.js";
import { disputes } from "./routes/disputes.js";
import { auth } from "./routes/auth.js";
import { userSettings } from "./routes/userSettings.js";
import { admin } from "./routes/admin.js";
import { adminUsers } from "./routes/adminUsers.js";
import { approvalRequests } from "./routes/approvalRequests.js";
import { withCookies, requireAuth, requireSuperAdmin, seedAdminFromEnv } from "./auth.js";
import { setupGoogleAuth } from "./googleAuth.js";
import { logger } from "./logger.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { attachPresence, presenceRest } from "./presence.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// אנחנו מאחורי Nginx - trust proxy headers
app.set('trust proxy', 1);

// Setup Google OAuth
setupGoogleAuth();

// Rate Limiting - prevent abuse
// בפיתוח: מקל, בפרודקשן: חמור
const isProduction = process.env.NODE_ENV === 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Production: 100, Development: 1000
  message: { error: 'יותר מדי בקשות. נסה שוב בעוד מספר דקות.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction, // Skip in development
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 20 : 1000, // Production: 20, Development: 1000 (increased from 5)
  message: { error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip in development
    if (!isProduction) return true;

    // Allow unlimited attempts for admin IPs (add your IP here)
    const clientIP = req.ip || req.connection.remoteAddress;
    const adminIPs = process.env.ADMIN_IPS?.split(',') || [];
    return adminIPs.includes(clientIP || '');
  },
});

logger.info("server", `Rate Limiting: ${isProduction ? 'ENABLED (Production)' : 'DISABLED (Development)'}`);

// CORS with credentials for cookie-based auth
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(withCookies());
app.use(express.json());
app.use(passport.initialize());

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);
// שירות קבצים סטטיים מעל התיקייה שממנה multer מעלה קבצים בזמן ריצה
// בזמן פיתוח הקבצים נמצאים תחת server/src/uploads; בזמן ריצה מ-dist נשתמש בנתיב יחסי יציב
const uploadsDir = path.isAbsolute("server/src/uploads")
  ? "server/src/uploads"
  : path.join(process.cwd(), "server/src/uploads");
app.use("/uploads", express.static(uploadsDir));

// Auth routes (public) - with stricter rate limiting
app.use("/api/auth", (req, res, next) => {

  return auth(req, res, next);
});

// User settings (requires auth)
app.use("/api/user", requireAuth, userSettings);

// Admin routes (requires auth)
app.use("/api/admin", requireAuth, admin);

// Admin user approval routes (public - accessed via email links)
app.use("/api/admin", adminUsers);

// Approval requests routes (requires auth)
app.use("/api/approval-requests", requireAuth, approvalRequests);

// Protect admin operations for tournaments
app.use("/api/tournaments", (req, res, next) => {
  // GET requests (bracket view) remain public
  if (req.method === "GET") return tournaments(req, res, next);
  // POST/PUT/DELETE require auth (create, seed, advance)
  return requireAuth(req, res, () => tournaments(req, res, next));
});

// Protect admin operations for matches
app.use("/api/matches", (req, res, next) => {
  // Override endpoint requires auth
  if (req.method === "POST" && /\/override$/.test(req.url)) {
    return requireAuth(req, res, () => matches(req, res, next));
  }
  // Submissions remain public (protected by token+pin)
  return matches(req, res, next);
});

// Disputes - admin only
app.use("/api/disputes", requireAuth, disputes);

const PORT = process.env.PORT || 8787;

// Start server with automatic retry if port is in use
async function startServer(port: number, retries = 0): Promise<void> {
  try {
    await seedAdminFromEnv();

    const server = app.listen(port, () => {
      logger.success("server", `Server started successfully on http://localhost:${port}`);
      logger.info("server", "All routes initialized:");
      logger.info("server", "  - /api/auth (public)");
      logger.info("server", "  - /api/user (requires auth)");
      logger.info("server", "  - /api/admin (requires auth)");
      logger.info("server", "  - /api/tournaments (mixed)");
      logger.info("server", "  - /api/matches (mixed)");
      logger.info("server", "  - /api/disputes (requires auth)");
      logger.info("server", "  - /presence (WebSocket)");
    });

    // Handle port already in use error
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.warn("server", `Port ${port} is already in use`);
        if (retries < 3) {
          const newPort = port + 1;
          logger.info("server", `Trying port ${newPort}...`);
          server.close();
          setTimeout(() => startServer(newPort, retries + 1), 1000);
        } else {
          logger.error("server", "Could not find available port after 3 retries");
          process.exit(1);
        }
      } else {
        logger.error("server", "Server error", error);
        process.exit(1);
      }
    });

    // Attach presence WebSocket
    const { getOnline } = attachPresence(server);
    presenceRest(app); // REST fallback
    logger.success("server", "Presence WebSocket attached to /presence");
  } catch (error) {
    logger.error("server", "Failed to start server", error);
    process.exit(1);
  }
}

startServer(Number(PORT));

