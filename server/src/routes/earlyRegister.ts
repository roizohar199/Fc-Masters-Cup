import { Router } from "express";
import Database from "better-sqlite3";
import db from "../db.js";

const router = Router();

// טיפול ממוקד ב-OPTIONS לנתיב הזה (ליתר בטחון)
router.options("/", (_req, res) => res.sendStatus(204));

type AppDb = Database.Database;
type RegistrationRow = { id: number; status: string };


router.post("/", (req, res) => {
  console.log("[early-register] BODY:", req.body);
  const { tournamentId, userId } = req.body || {};
  if (!tournamentId || !userId) {
    return res.status(400).json({ ok: false, error: "MISSING_PARAMS" });
  }

  try {
    const existing = db
      .prepare<[number, number], RegistrationRow | undefined>(
        `SELECT id, status
         FROM registrations
         WHERE userId = ? AND tournamentId = ?
         LIMIT 1`
      )
      .get(userId, tournamentId);

    if (existing) {
      db.prepare<[number, number]>(
        `UPDATE registrations SET updatedAt=? WHERE id=?`
      ).run(Date.now(), existing.id);

      return res.json({
        ok: true,
        registrationId: existing.id,
        status: existing.status,
        updated: true,
      });
    }

    const now = Date.now();
    const info = db
      .prepare<[number, number, string, number, number]>(
        `INSERT INTO registrations (userId, tournamentId, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(userId, tournamentId, "pending", now, now);

    return res.status(201).json({
      ok: true,
      registrationId: Number(info.lastInsertRowid),
      status: "pending",
    });
  } catch (err) {
    console.error("early-register error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

export default router;