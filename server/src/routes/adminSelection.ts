// server/src/routes/adminSelection.ts
import { Router } from "express";
import { selectPlayersForStage } from "../services/selectionService.js";

const router = Router();

// מומלץ לחבר כאן מידלוור isSuperAdmin
router.post("/tournaments/:id/select", (req: any, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const stage = String(req.body.stage || "R16").toUpperCase();
    const slots = req.body.slots ? Number(req.body.slots) : undefined;
    const notifyEmail = req.body.notifyEmail !== false;
    const notifyHomepage = req.body.notifyHomepage !== false;

    const result = selectPlayersForStage({
      tournamentId,
      stage,
      slots,
      sendEmails: notifyEmail,
      createHomepageNotice: notifyHomepage,
    });

    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message || "Failed" });
  }
});

export default router;
