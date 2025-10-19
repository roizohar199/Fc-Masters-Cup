// טוען את dotenv עם הנתיב לשורש
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען את קובץ .env מהשורש
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// מציג את הנתיב שנמצא
console.log("📂 Loaded .env from:", path.resolve(__dirname, "../.env"));
console.log("");

// מדפיס את כל המשתנים החשובים לבדיקה
console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET || "❌ Missing");
console.log("📧 SMTP_HOST:", process.env.SMTP_HOST || "❌ Missing");
console.log("📡 SMTP_PORT:", process.env.SMTP_PORT || "❌ Missing");
console.log("🔒 SMTP_SECURE:", process.env.SMTP_SECURE || "❌ Missing");
console.log("👤 SMTP_USER:", process.env.SMTP_USER || "❌ Missing");
console.log("🔑 SMTP_PASS:", process.env.SMTP_PASS ? "✅ Exists (hidden)" : "❌ Missing");
console.log("📨 EMAIL_FROM:", process.env.EMAIL_FROM || "❌ Missing");
console.log("");
console.log("✅ Environment file loaded successfully!");
