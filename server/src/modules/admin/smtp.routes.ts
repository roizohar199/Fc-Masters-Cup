import { Router } from "express";
import { sendMailSafe, verifySmtp } from "../mail/mailer.js";

export const smtpAdminRouter = Router();

// אפשר לעטוף ב-authMiddleware אצלך:
function isAdmin(req:any) { return req.user?.is_admin || req.user?.is_manager; }

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
    res.json({ ok: true, ...r });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

