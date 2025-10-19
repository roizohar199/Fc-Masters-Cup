import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען .env מהשורש
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true,
  debug: true,
});

try {
  await transporter.verify();
  console.log("✅ SMTP ready");

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: "yosiyoviv@gmail.com", // כתובת לבדיקה
    subject: "SMTP Test",
    text: "If you got this, SMTP works ✅",
  });

  console.log("📨 sent:", info.messageId, info.response);
} catch (err) {
  console.error("❌ send failed:", err);
}
