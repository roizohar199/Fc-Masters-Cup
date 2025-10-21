import { Router } from "express";
import Database from "better-sqlite3";
import { sendMailSafe, verifySmtp } from "../mail/mailer.js";

export const smtpAdminRouter = Router();

function isAdmin(req:any) { return req.user?.role === "admin" || req.user?.role === "super_admin" || req.user?.isSuperAdmin; }

smtpAdminRouter.get("/verify", async (req:any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const result = await verifySmtp();
  res.json(result);
});

smtpAdminRouter.post("/test", async (req:any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ error: "to required" });
  try {
    const r = await sendMailSafe(to, "SMTP Test ✔", `<div dir="rtl">בדיקת SMTP מהשרת ✅</div>`);
    res.json({ ok: true, messageId: r.messageId });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

smtpAdminRouter.get("/email-logs", (req:any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
  try {
    const rows = db.prepare(
      "SELECT id,to_email,subject,status,substr(error,1,140) AS error,created_at FROM email_logs ORDER BY id DESC LIMIT 50"
    ).all();
    res.json({ items: rows });
  } catch (e:any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

