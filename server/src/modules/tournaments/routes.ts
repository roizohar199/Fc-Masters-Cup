import { Router } from "express";
import { selectParticipants, flushEmailQueue } from "./selection.js";

// ודא שיש לך בדיקת הרשאות isAdmin || isManager
export const tournamentsRouter = Router();

tournamentsRouter.post("/:id/select", async (req: any, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ error: "forbidden" });
  }
  const id = req.params.id;
  const userIds: string[] = req.body.userIds || [];
  if (!userIds.length) return res.status(400).json({ error: "userIds required" });

  await selectParticipants(id, userIds);
  await flushEmailQueue();
  res.json({ ok: true });
});
