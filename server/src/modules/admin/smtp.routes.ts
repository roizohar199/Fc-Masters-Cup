import { Router } from "express";
import { createDbConnection } from "../../db.js";
import { sendMailSafe, verifySmtp } from "../mail/mailer.js";

export const smtpAdminRouter = Router();

function isAdmin(req:any) { return req.user?.is_admin || req.user?.is_manager || req.user?.role === "admin" || req.user?.role === "super_admin" || req.user?.isSuperAdmin; }

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
  const db = createDbConnection();
  try {
    const rows = db.prepare(
      "SELECT id,to_email,subject,status,substr(error,1,140) AS error,created_at FROM email_logs ORDER BY id DESC LIMIT 50"
    ).all();
    res.json({ items: rows });
  } catch (e:any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

smtpAdminRouter.get("/diag", async (req:any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });

  const to = String(req.query.to || "").trim();
  const db = createDbConnection();

  const verify = await verifySmtp();

  let sendResult: any = null;
  if (to) {
    try {
      const r = await sendMailSafe(to, "SMTP Diag ✔", `<div dir="rtl">בדיקת SMTP ✅</div>`);
      sendResult = { ok: true, messageId: r.messageId, response: r.response };
    } catch (e:any) {
      sendResult = { ok: false, error: String(e?.message || e) };
    }
  }

  const last = db.prepare(
    "SELECT id,to_email,subject,status,substr(error,1,160) AS error,message_id,substr(smtp_response,1,160) AS smtp_response,created_at FROM email_logs ORDER BY id DESC LIMIT 10"
  ).all();

  res.json({
    env: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
      admins: process.env.ADMIN_EMAILS,
    },
    verify,
    sendResult,
    lastLogs: last
  });
});

