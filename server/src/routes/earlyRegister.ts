import express from "express";
import type { Request, Response, NextFunction } from "express";
import Database from "better-sqlite3";

type IdRow = { id: string };
type RegistrationRow = { id: string; status: string };

const DB_PATH = process.env.DB_PATH || "./server/tournaments.sqlite";
const db = new Database(DB_PATH);

const router = express.Router();

const jsonNoCache = (res: Response) =>
  res.set({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });

router.options("/early-register", (req, res) => {
  jsonNoCache(res);
  res
    .status(204)
    .set({
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    })
    .end();
});

router.post(
  "/early-register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      jsonNoCache(res);
      console.log("[early-register] body:", req.body);

      const { tournamentId, userId } = (req.body ?? {}) as {
        tournamentId?: string;
        userId?: string;
      };

      if (!tournamentId || !userId) {
        return res
          .status(400)
          .json({ ok: false, error: "Missing tournamentId or userId" });
      }

      const getUser = db.prepare(`SELECT id FROM users WHERE id = ?`);
      const getTournament = db.prepare(
        `SELECT id FROM tournaments WHERE id = ?`
      );
      const getReg = db.prepare(
        `SELECT id, status FROM registrations WHERE userId = ? AND tournamentId = ?`
      );
      const insert = db.prepare(
        `INSERT INTO registrations (id, userId, tournamentId, status, createdAt)
         VALUES (lower(hex(randomblob(16))), ?, ?, 'pending',
                 strftime('%Y-%m-%dT%H:%M:%SZ','now'))`
      );

      const u = getUser.get(userId) as IdRow | undefined;
      if (!u) return res.status(404).json({ ok: false, error: "User not found" });

      const t = getTournament.get(tournamentId) as IdRow | undefined;
      if (!t)
        return res.status(404).json({ ok: false, error: "Tournament not found" });

      const existing = getReg.get(userId, tournamentId) as
        | RegistrationRow
        | undefined;

      if (existing) {
        console.log("[early-register] existing:", existing);
        return res.status(200).json({
          ok: true,
          already: true,
          registrationId: existing.id,
          status: existing.status,
        });
      }

      const tx = db.transaction((uid: string, tid: string): RegistrationRow => {
        insert.run(uid, tid);
        const row = getReg.get(uid, tid) as RegistrationRow;
        return row;
      });

      const created = tx(userId, tournamentId);
      console.log("[early-register] created:", created);

      return res.status(201).json({
        ok: true,
        registrationId: created.id,
        status: created.status ?? "pending",
      });
    } catch (err) {
      console.error("[early-register] ERROR:", err);
      // חשוב: תמיד לסגור תשובה
      return res.status(500).json({ ok: false, error: "Internal error" });
    }
  }
);

export default router;