#!/usr/bin/env node
/**
 * בדיקה ישירה של פונקציית sendPasswordResetEmail
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ייבוא הפונקציה ישירות
const { sendPasswordResetEmail } = await import("./dist/email.js");
const { createPasswordResetToken } = await import("./dist/auth.js");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🧪 בדיקה ישירה של sendPasswordResetEmail");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const email = process.argv[2] || "roizohar111@gmail.com";

console.log("📧 Email:", email);
console.log("🕒 Time:", new Date().toISOString());
console.log();

try {
  console.log("1️⃣ Creating password reset token...");
  const token = createPasswordResetToken(email);
  
  if (!token) {
    console.log("❌ Failed to create token!");
    process.exit(1);
  }
  
  console.log("✅ Token created:", token.substring(0, 20) + "...");
  console.log();

  console.log("2️⃣ Sending password reset email...");
  console.log("   (This should trigger the SMTP logs)");
  console.log();

  const result = await sendPasswordResetEmail(email, token);

  console.log();
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (result) {
    console.log("✅ Email sent successfully!");
    console.log();
    console.log("💡 Check your email:", email);
    console.log("   - Inbox");
    console.log("   - Spam/Junk");
    console.log("   - Promotions (Gmail)");
    console.log();
    console.log("⏱️  Wait 5-30 seconds");
  } else {
    console.log("❌ Email sending failed!");
    console.log();
    console.log("💡 Check the logs above for error details");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

} catch (error) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💥 Error:", error.message);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.error(error);
  process.exit(1);
}

