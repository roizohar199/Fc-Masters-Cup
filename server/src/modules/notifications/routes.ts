import { Router } from "express";
import { listUnreadForUser, markRead, markAllRead, deleteNotification } from "./model.js";

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

notificationsRouter.delete("/me/notifications/:id", (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  
  const notificationId = req.params.id;
  const result = deleteNotification(notificationId, userId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: "notification_not_found" });
  }
  
  res.json({ ok: true, message: "הודעה נמחקה בהצלחה" });
});
