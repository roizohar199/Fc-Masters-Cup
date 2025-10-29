import { Router } from "express";
import Database from "better-sqlite3";
import db from "../db.js";
import { decodeToken } from "../auth.js";

const router = Router();

// סוגרים OPTIONS מייד
router.options("/", (_req, res) => res.sendStatus(204));

type AppDb = Database.Database;
type RegistrationRow = { id: number; status: string };

// מנסה לגזור userId ממקורות נפוצים של auth
function deriveUserId(req: any): number | null {
  // ✅ ניסיון ראשון: req.user (מ-middleware)
  if (req.user?.id) {
    const n = Number(req.user.id);
    if (Number.isFinite(n) && n > 0) return n;
  }

  // ✅ ניסיון שני: JWT מ-cookie/header
  try {
    const COOKIE_NAME = "session";
    const token = req.cookies?.[COOKIE_NAME] || 
                  req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
                  req.headers["x-auth-token"];
    
    if (token) {
      console.log("[early-register] Found token in cookies/headers");
      const decoded = decodeToken(token);
      if (decoded && decoded.email) {
        // שליפת user id מהדאטאבייס לפי email
        const user = db.prepare(`SELECT id FROM users WHERE email=?`).get(decoded.email) as any;
        if (user && user.id) {
          const n = Number(user.id);
          if (Number.isFinite(n) && n > 0) {
            console.log("[early-register] Found userId from JWT:", n);
            return n;
          }
        }
      }
    }
  } catch (e) {
    console.log("[early-register] JWT decode failed:", e);
  }

  // ✅ ניסיון שלישי: משתנים אחרים
  const candidates = [
    resLocalUser(req)?.id,
    req.session?.user?.id,
    req.auth?.user?.id,
    req.headers["x-user-id"]
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

function resLocalUser(req: any) {
  // לעיתים שומרים משתמש ב-res.locals.user או ב-app.locals.currentUser
  try { return req.res?.locals?.user || req.app?.locals?.currentUser; } catch { return null; }
}

router.post("/", (req, res) => {
  const rawTournamentId = (req.body?.tournamentId ?? req.body?.tournament_id ?? req.query?.tournamentId);
  const derivedUserId = deriveUserId(req);
  const rawUserId = (req.body?.userId ?? req.body?.user_id ?? derivedUserId);

  const tournamentId = Number(rawTournamentId);
  const userId = Number(rawUserId);

  // לוג אבחוני מינימלי
  console.log("[early-register] incoming:", {
    body: req.body,
    derivedUserId,
    finalUserId: userId,
    finalTournamentId: tournamentId
  });

  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_TOURNAMENT_ID" });
  }
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(401).json({ ok: false, error: "USER_NOT_AUTHENTICATED" });
  }

  try {
    // ⬅️ שים לב: שם הטבלה לפי ה־DB שלך
    const existing = db
      .prepare<[number, number], RegistrationRow | undefined>(
        `SELECT id, status
         FROM tournament_registrations
         WHERE userId = ? AND tournamentId = ?
         LIMIT 1`
      )
      .get(userId, tournamentId);

    if (existing) {
      db.prepare<[number, number]>(`UPDATE tournament_registrations SET updatedAt=? WHERE id=?`)
        .run(Date.now(), existing.id);

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
        `INSERT INTO tournament_registrations (userId, tournamentId, status, createdAt, updatedAt)
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