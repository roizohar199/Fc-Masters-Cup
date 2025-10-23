// server/src/routes/health.ts
import { Router } from "express";
import os from "os";
import path from "path";
import fs from "fs";

const router = Router();

const readPkgVersion = (): string => {
  try {
    const pkgPath = path.resolve(__dirname, "../../package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    return JSON.parse(raw).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
};

// בריאות ציבורית – בלי Auth!
router.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "fcmasters-api",
    version: readPkgVersion(),
    uptime: process.uptime(),
    pid: process.pid,
    node: process.version,
    hostname: os.hostname(),
    time: new Date().toISOString(),
  });
});

export default router;
