import { Router } from "express";
import Database from "better-sqlite3";
import db from "../db.js";
import { decodeToken } from "../auth.js";
import { uuid } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";

const router = Router();

// סוגרים OPTIONS מייד
router.options("/", (_req, res) => res.sendStatus(204));

type AppDb = Database.Database;
type RegistrationRow = { id: string; state: string };

// מנסה לגזור userId ממקורות נפוצים של auth (מחזיר string - כפי שבדאטאבייס)
function deriveUserId(req: any): string | null {
  // ✅ ניסיון ראשון: req.user (מ-middleware)
  if (req.user?.id || req.user?.uid) {
    const userId = String(req.user.id || req.user.uid);
    if (userId && userId.trim()) return userId.trim();
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
          const userId = String(user.id);
          console.log("[early-register] Found userId from JWT:", userId);
          return userId;
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
    if (v) {
      const userId = String(v);
      if (userId && userId.trim()) return userId.trim();
    }
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

  // המרה ל-string (כפי שבדאטאבייס)
  const tournamentId = rawTournamentId ? String(rawTournamentId).trim() : null;
  const userId = rawUserId ? String(rawUserId).trim() : null;

  // לוג אבחוני מינימלי
  console.log("[early-register] incoming:", {
    body: req.body,
    derivedUserId,
    finalUserId: userId,
    finalTournamentId: tournamentId
  });

  if (!tournamentId || tournamentId.length === 0) {
    return res.status(400).json({ ok: false, error: "INVALID_TOURNAMENT_ID" });
  }
  if (!userId || userId.length === 0) {
    return res.status(401).json({ ok: false, error: "USER_NOT_AUTHENTICATED" });
  }

  try {
    // ✅ חיפוש רישום קיים (משתמש ב-state ולא status)
    const existing = db
      .prepare<[string, string], RegistrationRow | undefined>(
        `SELECT id, state
         FROM tournament_registrations
         WHERE userId = ? AND tournamentId = ?
         LIMIT 1`
      )
      .get(userId, tournamentId);

    if (existing) {
      // עדכון תאריך עדכון
      db.prepare<[string, string]>(`UPDATE tournament_registrations SET updatedAt=? WHERE id=?`)
        .run(nowISO(), existing.id);

      return res.json({
        ok: true,
        registrationId: existing.id,
        status: existing.state, // מחזירים כקומפיטביליות
        state: existing.state,
        updated: true,
      });
    }

    // ✅ יצירת רישום חדש
    const registrationId = uuid();
    const now = nowISO();
    db.prepare<[string, string, string, string, string, string]>(
      `INSERT INTO tournament_registrations (id, userId, tournamentId, state, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(registrationId, userId, tournamentId, "registered", now, now);

    return res.status(201).json({
      ok: true,
      registrationId: registrationId,
      status: "registered", // מחזירים כקומפיטביליות
      state: "registered",
    });
  } catch (err) {
    console.error("early-register error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

export default router;