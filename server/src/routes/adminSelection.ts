// server/src/routes/adminSelection.ts
import { Router } from "express";
import { selectPlayersForStage } from "../services/selectionService.js";
import Database from "better-sqlite3";

const router = Router();

// קבלת שחקנים ששילמו לטורניר
router.get("/paid-players/:tournamentId", (req: any, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
    
    // בדיקה אם יש טבלת registrations
    const hasRegistrations = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='registrations';")
      .get();

    let players: any[] = [];

    if (hasRegistrations) {
      players = db.prepare(`
        SELECT u.id, u.email, u.display_name, u.payment_status, u.psnUsername
        FROM registrations r
        JOIN users u ON u.id = r.user_id
        WHERE r.tournament_id = ? AND r.status IN ('confirmed','approved') 
              AND u.email IS NOT NULL 
              AND u.payment_status = 'paid'
        ORDER BY u.display_name
      `).all(tournamentId);
    } else {
      players = db.prepare(`
        SELECT id, email, display_name, payment_status, psnUsername
        FROM users
        WHERE (status = 'active' OR status IS NULL) 
              AND email IS NOT NULL 
              AND payment_status = 'paid'
        ORDER BY display_name
      `).all();
    }

    db.close();
    res.json({ ok: true, players });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message || "Failed" });
  }
});

// עדכון סטטוס תשלום של שחקן
router.post("/players/:playerId/payment-status", (req: any, res) => {
  try {
    const playerId = req.params.playerId;
    const { payment_status } = req.body;
    
    if (!['pending', 'paid', 'refunded'].includes(payment_status)) {
      return res.status(400).json({ ok: false, error: "Invalid payment status" });
    }
    
    const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
    const result = db.prepare(`
      UPDATE users 
      SET payment_status = ? 
      WHERE id = ?
    `).run(payment_status, playerId);
    
    db.close();
    
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Player not found" });
    }
    
    res.json({ ok: true, message: "Payment status updated" });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message || "Failed" });
  }
});

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
