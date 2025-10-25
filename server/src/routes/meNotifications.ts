// server/src/routes/meNotifications.ts
import { Router } from "express";
import { listUserNotifications, markNotificationRead } from "../utils/notify.js";
import db from "../db.js";

const router = Router();

// דורש זיהוי משתמש – החלף ל-auth שלך (req.user.id)
router.get("/me/notifications", (req: any, res) => {
  if (!req.user?.id) return res.status(401).json({ ok: false });
  const rows = listUserNotifications(db, Number(req.user.id));
  res.json({ ok: true, items: rows });
});

router.post("/me/notifications/:id/read", (req: any, res) => {
  if (!req.user?.id) return res.status(401).json({ ok: false });
  markNotificationRead(db, Number(req.user.id), Number(req.params.id));
  res.json({ ok: true });
});

export default router;
