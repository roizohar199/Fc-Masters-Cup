import { Router } from "express";
import { listUnreadForUser, markRead, markAllRead } from "./model.js";

export const notificationsRouter = Router();

// דרוש middleware שמזהה את המשתמש (req.user.id)
notificationsRouter.get("/me/notifications", (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  res.json({ notifications: listUnreadForUser(userId) });
});

notificationsRouter.patch("/me/notifications/:id/read", (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  markRead(userId, req.params.id);
  res.json({ ok: true });
});

notificationsRouter.patch("/me/notifications/read-all", (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  const info = markAllRead(userId);
  res.json({ ok: true, changes: (info as any).changes ?? 0 });
});
