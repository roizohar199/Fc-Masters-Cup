import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyPassword } from "../auth.js";
import db from "../db.js";
import argon2 from "argon2";
import { z } from "zod";

export const userSettings = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

const ChangePasswordDTO = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const UpdatePSNUsernameDTO = z.object({
  psnUsername: z.string().min(3).max(50),
});

userSettings.post("/change-password", limiter, async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const parsed = ChangePasswordDTO.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "נתונים לא תקינים" });

  const { currentPassword, newPassword } = parsed.data;

  // אימות סיסמה נוכחית
  const userRecord = db.prepare(`SELECT passwordHash FROM users WHERE email=?`).get(user.email) as any;
  if (!userRecord) return res.status(404).json({ error: "משתמש לא נמצא" });

  const isValid = await verifyPassword(currentPassword, userRecord.passwordHash);
  if (!isValid) return res.status(401).json({ error: "הסיסמה הנוכחית שגויה" });

  // עדכון סיסמה
  const newHash = await argon2.hash(newPassword);
  db.prepare(`UPDATE users SET passwordHash=? WHERE email=?`).run(newHash, user.email);

  res.json({ ok: true, message: "הסיסמה שונתה בהצלחה" });
});

// עדכון PSN Username
userSettings.post("/update-psn", limiter, async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const parsed = UpdatePSNUsernameDTO.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "שם משתמש PSN לא תקין (3-50 תווים)" });

  const { psnUsername } = parsed.data;

  // בדיקה אם PSN Username כבר קיים
  const existing = db.prepare(`SELECT id FROM users WHERE psnUsername=? AND email!=?`).get(psnUsername, user.email);
  if (existing) return res.status(400).json({ error: "שם משתמש PSN זה כבר תפוס" });

  // עדכון PSN Username
  db.prepare(`UPDATE users SET psnUsername=? WHERE email=?`).run(psnUsername, user.email);

  res.json({ ok: true, message: "שם המשתמש PSN עודכן בהצלחה" });
});

// קבלת פרטי המשתמש כולל PSN Username
userSettings.get("/profile", async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const userRecord = db.prepare(`SELECT email, psnUsername, secondPrizeCredit FROM users WHERE email=?`).get(user.email) as any;
  if (!userRecord) return res.status(404).json({ error: "משתמש לא נמצא" });

  res.json({ 
    ok: true, 
    email: userRecord.email,
    psnUsername: userRecord.psnUsername,
    secondPrizeCredit: userRecord.secondPrizeCredit
  });
});

