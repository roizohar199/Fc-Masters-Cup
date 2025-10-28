// server/src/routes/adminEmail.ts
import { Router } from "express";
import { verifySmtp, sendMail } from "../services/mailer.js";
const r = Router();

r.get("/smtp/verify", async (_req, res) => {
  const ok = await verifySmtp();
  res.json({ ok });
});

r.post("/smtp/test", async (req, res) => {
  const to = (req.body?.to || process.env.ADMIN_EMAIL) as string;
  try {
    const info = await sendMail({ 
      to, 
      subject: "SMTP test - FC Masters Cup", 
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🧪 בדיקת SMTP</h2>
          <p>שלום,</p>
          <p>זהו מייל בדיקה למערכת SMTP של FC Masters Cup.</p>
          <p>אם אתה רואה את המייל הזה, המערכת עובדת תקין! ✅</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            FC Masters Cup • מערכת ניהול טורנירים
          </p>
        </div>
      `
    });
    res.json({ ok: true, info });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default r;
