// טען .env לפני הכל
import { loadEnvSafely } from "./loadEnv.js";
loadEnvSafely();

console.log("ENV check → HOST:", process.env.SMTP_HOST, "| USER:", process.env.SMTP_USER, "| FROM:", process.env.EMAIL_FROM);

import express from "express";
import cors from "cors";
import path from "node:path";
import http from "node:http";
import rateLimit from "express-rate-limit";
import { tournaments } from "./routes/tournaments.js";
import { matches } from "./routes/matches.js";
import { disputes } from "./routes/disputes.js";
import { auth } from "./routes/auth.js";
import { userSettings } from "./routes/userSettings.js";
import { admin } from "./routes/admin.js";
import { adminUsers } from "./routes/adminUsers.js";
import { approvalRequests } from "./routes/approvalRequests.js";
import { tournamentRegistrations } from "./routes/tournamentRegistrations.js";
import { draw } from "./routes/draw.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { tournamentsRouter } from "./modules/tournaments/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { withCookies, requireAuth, requireSuperAdmin, seedAdminFromEnv } from "./auth.js";
import { logger } from "./logger.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { attachPresence, presenceRest } from "./presence.js";
import { apiErrorHandler, apiNotFoundHandler } from "./errorHandler.js";
import { presenceApi } from "./routes/presenceApi.js";
import { initPresence } from "./presence/index.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// אנחנו מאחורי Nginx - trust proxy headers
app.set('trust proxy', 1);

// Rate Limiting - prevent abuse
// בפיתוח: מקל, בפרודקשן: חמור
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting disabled - no limits
const apiLimiter = (req: any, res: any, next: any) => next();

// Rate limiting disabled - no limits
const authLimiter = (req: any, res: any, next: any) => next();

logger.info("server", `Rate Limiting: ${isProduction ? 'ENABLED (Production)' : 'DISABLED (Development)'}`);

// CORS with credentials for cookie-based auth
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
logger.info("server", `CORS Origin: ${ORIGIN}`);
if (!process.env.CORS_ORIGIN) {
  logger.warn("server", "⚠️  CORS_ORIGIN not set in .env, using default: http://localhost:5173");
  logger.warn("server", "⚠️  For production with HTTPS, set: CORS_ORIGIN=https://your-domain.com");
}
app.use(cors({
  origin: ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(withCookies());
app.use(express.json());

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
app.use("/api/admin-approval", adminUsers);

// Approval requests routes (requires auth)
app.use("/api/approval-requests", requireAuth, approvalRequests);

// Tournament registrations routes (mixed - summary public, register/admin require auth)
app.use("/api/tournament-registrations", tournamentRegistrations);

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

// Presence tracking (public - heartbeat/leave)
app.use("/api/presence", presenceApi);

// Draw routes (GET public for viewing, POST requires admin auth)
app.use("/api/draw", (req, res, next) => {
  // GET requests are public (viewing draw ceremony)
  if (req.method === "GET") return draw(req, res, next);
  // POST requires admin auth (controlling draw)
  return requireAuth(req, res, () => draw(req, res, next));
});

// Notifications routes (requires auth)
app.use("/api", requireAuth, notificationsRouter);

// Admin email routes (requires admin auth)
app.use("/api/admin", requireAuth, adminRouter);

// Users routes (public - basic user info)
app.use("/api/users", usersRouter);

// ✅ API 404 handler - must come AFTER all API routes but BEFORE SPA fallback
app.use(apiNotFoundHandler);

// ✅ Serve static files from client build (production)
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// ✅ SPA fallback - must come LAST, after all API routes
// This serves index.html for any non-API routes (client-side routing)
app.get("*", (req, res, next) => {
  // Skip if this is an API or WebSocket request
  if (req.path.startsWith('/api/') || req.path.startsWith('/presence') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  const indexPath = path.join(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error("server", "Failed to send index.html", err);
      res.status(500).json({ error: "Failed to load application" });
    }
  });
});

// ✅ Global error handler - must be LAST
app.use(apiErrorHandler);

const PORT = process.env.PORT || 8787;

// Start server with automatic retry if port is in use
async function startServer(port: number, retries = 0): Promise<void> {
  try {
    await seedAdminFromEnv();

    // Initialize Presence system (Redis or Memory fallback)
    await initPresence();

    // Create HTTP server explicitly (required for WebSocket upgrade handling)
    const server = http.createServer(app);

    // Attach presence WebSocket with noServer: true
    const { getOnline, wss } = attachPresence(server);
    presenceRest(app); // REST fallback
    
    // Set WSS instance for broadcasting draw events
    const { setWssInstance } = await import("./presence.js");
    setWssInstance(wss);

    // ✅ Handle WebSocket upgrade manually (robust behind Nginx)
    server.on("upgrade", (req, socket, head) => {
      const url = req.url || '';
      logger.info("websocket", `Upgrade request for: ${url}`);
      
      if (url.startsWith('/presence')) {
        wss.handleUpgrade(req, socket as any, head, (ws) => {
          wss.emit('connection', ws, req);
          logger.success("websocket", `WebSocket connection upgraded successfully`);
        });
      } else {
        logger.warn("websocket", `Invalid WebSocket path: ${url}`);
        socket.destroy();
      }
    });

    // Start listening
    server.listen(port, () => {
      logger.success("server", `Server started successfully on http://localhost:${port}`);
      logger.info("server", `Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info("server", `CORS Origin: ${ORIGIN}`);
      logger.info("server", "");
      logger.info("server", "📡 API Routes initialized:");
      logger.info("server", "  - /api/auth (public)");
      logger.info("server", "  - /api/user (requires auth)");
      logger.info("server", "  - /api/admin (requires auth)");
      logger.info("server", "  - /api/tournaments (mixed)");
      logger.info("server", "  - /api/tournament-registrations (mixed)");
      logger.info("server", "  - /api/matches (mixed)");
      logger.info("server", "  - /api/disputes (requires auth)");
      logger.info("server", "");
      logger.info("server", "🔌 WebSocket Routes:");
      logger.info("server", "  - /presence (WebSocket - Real-time user presence)");
      logger.info("server", "");
      if (isProduction) {
        logger.warn("server", "⚠️  Production Mode:");
        logger.warn("server", "  - Ensure Nginx is configured with SSL + WebSocket headers");
        logger.warn("server", "  - WebSocket will use WSS (secure) on HTTPS");
        logger.warn("server", "  - See: nginx-config-k-rstudio-ssl.txt for config");
      } else {
        logger.info("server", "💡 Development Mode:");
        logger.info("server", "  - WebSocket will use WS (non-secure) on HTTP");
        logger.info("server", "  - Frontend should connect to: ws://localhost:" + port + "/presence");
      }
      logger.success("server", "Presence WebSocket attached to /presence with manual upgrade handling");
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
  } catch (error) {
    logger.error("server", "Failed to start server", error);
    process.exit(1);
  }
}

startServer(Number(PORT));

