import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { logger } from "./logger.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * טוען קובץ .env באופן עמיד - מחפש אותו בשורש הפרויקט או בתיקיית server
 */
export function loadEnvSafely() {
  // נסה למצוא את שורש הפרויקט
  const possiblePaths = [
    // מהתיקייה הנוכחית (כשרצים מ-server/dist)
    resolve(process.cwd(), ".env"),
    // מהשורש (כשרצים מה-root)
    resolve(process.cwd(), "../../.env"),
    // מתיקיית server
    resolve(process.cwd(), "../.env"),
    // נסיון נוסף - מהמיקום של הקובץ הנוכחי
    resolve(__dirname, "../../../.env"),
    resolve(__dirname, "../../.env"),
  ];

  let envLoaded = false;
  let loadedFrom = "";

  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      const result = config({ path: envPath });
      if (!result.error) {
        envLoaded = true;
        loadedFrom = envPath;
        logger.success("env", `.env loaded from: ${envPath}`);
        break;
      }
    }
  }

  if (!envLoaded) {
    logger.warn("env", ".env file not found in any expected location!", { searched: possiblePaths });
    logger.warn("env", "Using environment variables only");
  }

  // הדפס משתנים חשובים (ללא ערכים רגישים)
  logger.info("env", "Configuration check:", {
    PORT: process.env.PORT || "8787 (default)",
    NODE_ENV: process.env.NODE_ENV || "development (default)",
    DB_PATH: process.env.DB_PATH || "./tournaments.sqlite (default)",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173 (default)",
    JWT_SECRET: process.env.JWT_SECRET ? "✓ Set" : "✗ NOT SET (using dev_secret)",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "✓ Set" : "✗ NOT SET",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "✓ Set" : "✗ NOT SET",
    SMTP_USER: process.env.SMTP_USER ? "✓ Set" : "○ Not set (optional)"
  });

  return envLoaded;
}
