import { Router } from "express";
import Database from "better-sqlite3";

const router = Router();

type AppDb = Database.Database;
type RegistrationRow = { id: number; status: string };

function getDb(req: any): AppDb {
  const db = (req.app?.locals?.db || req.app?.get("db")) as AppDb | undefined;
  if (!db) throw new Error("DB instance not found on app.locals.db");
  return db;
}

router.post("/early-register", (req, res) => {
  const { tournamentId, userId } = req.body || {};
  if (!tournamentId || !userId) {
    return res.status(400).json({ ok: false, error: "MISSING_PARAMS" });
  }

  try {
    const db = getDb(req);

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