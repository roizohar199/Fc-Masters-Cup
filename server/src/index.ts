// ✅ קובץ: server/src/index.ts
// טען .env לפני הכל
import { loadEnvSafely } from "./loadEnv.js";
loadEnvSafely();

console.log(
  "ENV check → HOST:",
  process.env.SMTP_HOST,
  "| USER:",
  process.env.SMTP_USER,
  "| FROM:",
  process.env.EMAIL_FROM
);

// ===== INLINE DB MIGRATION (alias for path to avoid TS2300 duplicate identifier) =====
import "dotenv/config";
import { resolve as pResolve } from "path"; // <-- שימוש ב־alias במקום 'path'
import fs from "fs";
import Database from "better-sqlite3";
import { ensureSchema } from "./utils/ensureSchema.js";

// אם יש בקובץ למטה `import path from "path"` או `const path = require("path")` — מחק אותם.
// מעכשיו משתמשים רק ב-pResolve בתוך בלוק המיגרציה הזה.

function resolveDbPath(): string {
  if (process.env.DB_PATH && process.env.DB_PATH.trim())
    return process.env.DB_PATH.trim();
  const candidates = [
    // הרצה מתוך dist/
    pResolve(__dirname, "../tournaments.sqlite"),
    // fallback
    pResolve(__dirname, "./tournaments.sqlite"),
    // cwd אופציות
    pResolve(process.cwd(), "server/tournaments.sqlite"),
    pResolve(process.cwd(), "tournaments.sqlite"),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return candidates[0]; // יצירה ברירת מחדל אם לא קיים
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const rows = db
    .prepare(`PRAGMA table_info(${table});`)
    .all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  type: string,
  defaultExpr?: string
) {
  if (!hasColumn(db, table, column)) {
    const sql = defaultExpr
      ? `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultExpr};`
      : `ALTER TABLE ${table} ADD COLUMN ${column} ${type};`;
    console.log(`[migrate] Adding ${table}.${column} (${type})`);
    db.exec(sql);
  }
}

(function runMigrationsInline() {
  const DB_PATH = resolveDbPath();
  if (!fs.existsSync(DB_PATH)) {
    console.warn(
      `[migrate] DB not found at ${DB_PATH}. It will be created if needed.`
    );
  }

  const db = new Database(DB_PATH);
  db.exec("BEGIN;");
  try {
    // בסיס טבלאות (איידמפוטנטי)
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE
      );
    `);

    // עמודות דרושות
    ensureColumn(db as any, "admins", "display_name", "TEXT");
    ensureColumn(db as any, "users", "display_name", "TEXT");
    ensureColumn(db as any, "users", "payment_status", "TEXT", "'pending'");

    // אתחול display_name מתוך email אם חסר
    if (hasColumn(db as any, "admins", "email")) {
      db.exec(
        `UPDATE admins SET display_name = COALESCE(NULLIF(display_name,''), substr(email,1,instr(email,'@')-1))
         WHERE display_name IS NULL OR display_name = '';`
      );
    }
    if (hasColumn(db as any, "users", "email")) {
      db.exec(
        `UPDATE users SET display_name = COALESCE(NULLIF(display_name,''), substr(email,1,instr(email,'@')-1))
         WHERE display_name IS NULL OR display_name = '';`
      );
    }

    // ✅ הפעלת מחזק הסכימה המלא
    console.log("[migrate] Running ensureSchema...");
    ensureSchema(db);
    console.log("[migrate] ensureSchema completed ✅");

    db.exec("COMMIT;");
    console.log("[migrate] OK ✅");
  } catch (e) {
    db.exec("ROLLBACK;");
    console.error("[migrate] FAILED ❌", e);
    throw e;
  } finally {
    db.close();
  }
})();
// ===== END INLINE DB MIGRATION =====

import dns from "dns";
dns.setDefaultResultOrder?.("ipv4first"); // מונע התחברויות IPv6 שיכולות ליפול אצל ספקים

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
import { notificationsRouter } from "./modules/notifications/routes.js";
import { tournamentsRouter } from "./modules/tournaments/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { smtpAdminRouter } from "./modules/admin/smtp.routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { settings } from "./routes/settings.js";
import { withCookies, requireAuth, requireSuperAdmin, seedAdminFromEnv } from "./auth.js";
import { logger } from "./logger.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { attachPresence, presenceRest } from "./presence.js";
import { apiErrorHandler, apiNotFoundHandler } from "./errorHandler.js";
import { presenceApi } from "./routes/presenceApi.js";
import { initPresence } from "./presence/index.js";
import adminSelection from "./routes/adminSelection.js";
import meNotifications from "./routes/meNotifications.js";
import manualBracketRouter from "./routes/manualBracket.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// אנחנו מאחורי Nginx - trust proxy headers
app.set("trust proxy", 1);

// Rate Limiting - prevent abuse
// בפיתוח: מקל, בפרודקשן: חמור
const isProduction = process.env.NODE_ENV === "production";

// Rate limiting disabled - no limits כרגע
const apiLimiter = (_req: any, _res: any, next: any) => next();
const authLimiter = (_req: any, _res: any, next: any) => next();

logger.info(
  "server",
  `Rate Limiting: ${isProduction ? "ENABLED (Production)" : "DISABLED (Development)"}`
);

// ---------- CORS משופר: תמיכה בריבוי מקורות ----------
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

logger.info("server", `CORS Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);

app.use(
  cors({
    origin: (origin, cb) => {
      // לבקשות ללא Origin (curl/server-2-server) נאפשר
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(withCookies());
app.use(express.json());

// ✅ בריאות ציבורית – לפני כל ה-auth
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "fcmasters-api",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// שירות קבצים סטטיים בזמן ריצה (uploads ידניים)
const uploadsDir = path.isAbsolute("server/src/uploads")
  ? "server/src/uploads"
  : path.join(process.cwd(), "server/src/uploads");
app.use("/uploads", express.static(uploadsDir));

// Auth routes (public)
app.use("/api/auth", (req, res, next) => auth(req, res, next));

// User settings (requires auth)
app.use("/api/user", requireAuth, userSettings);

// Admin routes (requires auth)
app.use("/api/admin", requireAuth, admin);

// Admin user approval routes (public - accessed via email links)
app.use("/api/admin-approval", adminUsers);

// Approval requests routes (requires auth)
app.use("/api/approval-requests", requireAuth, approvalRequests);

// Tournament registrations routes (mixed)
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

// Admin selection routes (requires auth)
app.use("/api/admin", requireAuth, adminSelection);

// User notifications routes (requires auth)
app.use("/api", requireAuth, meNotifications);


// Notifications routes (requires auth)
app.use("/api", requireAuth, notificationsRouter);

// Admin email routes (requires admin auth)
app.use("/api/admin", requireAuth, adminRouter);

// SMTP Admin routes (requires admin auth)
app.use("/api/admin/smtp", requireAuth, smtpAdminRouter);

// Users routes (public - basic user info)
app.use("/api/users", usersRouter);

// Settings routes (requires auth)
app.use("/api/settings", requireAuth, settings);

// Manual bracket routes (mixed auth - public views, admin creation)
app.use(manualBracketRouter);

// ✅ API 404 handler - must come AFTER all API routes but BEFORE SPA fallback
app.use(apiNotFoundHandler);

// ✅ Serve static files from client build (production)
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// ✅ SPA fallback - must come LAST, after all API routes
app.get("*", (req, res, next) => {
  // Skip if this is an API/WS/uploads request
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/presence") ||
    req.path.startsWith("/uploads/")
  ) {
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

    // Verify SMTP connection at startup
    const { verifySmtp } = await import("./modules/mail/mailer.js");
    verifySmtp()
      .then((r) => {
        if (!r.ok) console.error("⚠️ SMTP verify failed at startup:", r);
      })
      .catch((e) => console.error("⚠️ SMTP verify exception:", e));

    // Create HTTP server explicitly (required for WebSocket upgrade handling)
    const server = http.createServer(app);

    // Attach presence WebSocket with noServer: true
    const { getOnline, wss } = attachPresence(server);
    presenceRest(app); // REST fallback


    // ✅ Handle WebSocket upgrade manually (robust behind Nginx)
    server.on("upgrade", (req, socket, head) => {
      const url = req.url || "";
      logger.info("websocket", `Upgrade request for: ${url}`);

      if (url.startsWith("/presence")) {
        wss.handleUpgrade(req, socket as any, head, (ws) => {
          wss.emit("connection", ws, req);
          logger.success(
            "websocket",
            `WebSocket connection upgraded successfully`
          );
        });
      } else {
        logger.warn("websocket", `Invalid WebSocket path: ${url}`);
        socket.destroy();
      }
    });

    // Start listening
    server.listen(port, () => {
      logger.success("server", `Server started successfully on http://localhost:${port}`);
      logger.info("server", `Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info("server", `CORS Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
      logger.info("server", "");
      logger.info("server", "📧 SMTP Configuration:");
      logger.info("server", `  - Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}`);
      logger.info("server", `  - Port: ${process.env.SMTP_PORT || 587}`);
      logger.info("server", `  - Secure: ${process.env.SMTP_SECURE || "false"}`);
      logger.info("server", `  - From: ${process.env.EMAIL_FROM || process.env.SMTP_USER || "NOT_SET"}`);
      logger.info("server", "");
      logger.info("server", "📡 API Routes initialized:");
      logger.info("server", "  - /api/health (public)");
      logger.info("server", "  - /api/auth (public)");
      logger.info("server", "  - /api/user (requires auth)");
      logger.info("server", "  - /api/admin (requires auth)");
      logger.info("server", "  - /api/admin/smtp (requires admin auth)");
      logger.info("server", "  - ועוד…");
      logger.info("server", "");
      logger.info("server", "🔌 WebSocket Routes:");
      logger.info("server", "  - /presence (WebSocket - Real-time user presence)");
      logger.info("server", "");
      if (isProduction) {
        logger.warn("server", "⚠️  Production Mode:");
        logger.warn("server", "  - Ensure Nginx is configured with SSL + WebSocket headers");
        logger.warn("server", "  - WebSocket will use WSS (secure) on HTTPS");
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
