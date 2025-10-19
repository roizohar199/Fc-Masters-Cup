#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 Debug DB Path");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("Current script location:");
console.log("  __dirname:", __dirname);
console.log("  __filename:", __filename);
console.log();

// כמו ב-dist/db.js
const distDir = path.join(__dirname, "dist");
const dbPathFromDist = path.join(distDir, "../tournaments.sqlite");
const dbPathResolved = path.resolve(dbPathFromDist);

console.log("As if running from dist/:");
console.log("  dist dir:", distDir);
console.log("  ../tournaments.sqlite:", dbPathFromDist);
console.log("  Resolved:", dbPathResolved);
console.log("  Exists?", existsSync(dbPathResolved) ? "✅ YES" : "❌ NO");
console.log();

// הנתיב הנכון
const correctPath = path.join(__dirname, "tournaments.sqlite");
console.log("Correct path:");
console.log("  Path:", correctPath);
console.log("  Exists?", existsSync(correctPath) ? "✅ YES" : "❌ NO");
console.log();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

