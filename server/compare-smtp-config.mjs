#!/usr/bin/env node
/**
 * סקריפט להשוואת תצורת SMTP בין test-send.js לבין email.ts
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען .env מהשורש
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📧 SMTP Configuration Comparison");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// תצורה כמו ב-test-send.js
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

const config = {
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM,
};

console.log("Environment Variables:");
console.log("─────────────────────────────────────────");
console.log("SMTP_HOST:    ", process.env.SMTP_HOST || "❌ NOT SET");
console.log("SMTP_PORT:    ", process.env.SMTP_PORT || "❌ NOT SET (default: 587)");
console.log("SMTP_SECURE:  ", process.env.SMTP_SECURE || "❌ NOT SET (default: false)");
console.log("SMTP_USER:    ", process.env.SMTP_USER || "❌ NOT SET");
console.log("SMTP_PASS:    ", process.env.SMTP_PASS ? `✅ SET (***${process.env.SMTP_PASS.slice(-4)})` : "❌ NOT SET");
console.log("EMAIL_FROM:   ", process.env.EMAIL_FROM || "❌ NOT SET");
console.log();

console.log("Parsed Configuration (same as test-send.js and email.ts):");
console.log("─────────────────────────────────────────");
console.log("Host:         ", config.host || "❌ MISSING");
console.log("Port:         ", config.port, "(type:", typeof config.port + ")");
console.log("Secure:       ", config.secure, "(type:", typeof config.secure + ")");
console.log("User:         ", config.user || "❌ MISSING");
console.log("Pass:         ", config.pass ? `✅ SET (***${config.pass.slice(-4)})` : "❌ MISSING");
console.log("From:         ", config.from || "❌ MISSING");
console.log();

// בדיקת תקינות
let valid = true;
const errors = [];

if (!config.host) {
  errors.push("❌ SMTP_HOST is missing");
  valid = false;
}

if (!config.user) {
  errors.push("❌ SMTP_USER is missing");
  valid = false;
}

if (!config.pass) {
  errors.push("❌ SMTP_PASS is missing");
  valid = false;
}

if (!config.from) {
  errors.push("⚠️  EMAIL_FROM is missing (will use fallback)");
}

console.log("Validation:");
console.log("─────────────────────────────────────────");
if (valid && config.from) {
  console.log("✅ All required SMTP settings are configured!");
  console.log("✅ Configuration matches test-send.js");
} else if (valid) {
  console.log("⚠️  SMTP is configured but EMAIL_FROM is missing");
  console.log("   Will use fallback: \"FC Masters Cup <" + config.user + ">\"");
} else {
  console.log("❌ SMTP configuration is incomplete:");
  errors.forEach(err => console.log("   " + err));
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (!valid) {
  console.log("\n💡 To fix:");
  console.log("   1. Create .env file from env.example");
  console.log("   2. Set SMTP_HOST, SMTP_USER, SMTP_PASS");
  console.log("   3. Optionally set SMTP_PORT (default: 587)");
  console.log("   4. Optionally set SMTP_SECURE (default: false)");
  console.log("   5. Optionally set EMAIL_FROM");
  process.exit(1);
} else {
  console.log("\n✅ Ready to send emails!");
  console.log("   Test with: node test-send.js");
  console.log("   Or test forgot-password: node test-forgot-password-manual.mjs");
}

