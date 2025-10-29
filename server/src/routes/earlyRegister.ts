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

// ====== עזר: גזירת userId בצורה עמידה (JWT/email/headers) - עובד עם UUID/TEXT ======
function deriveUserId(req: any): string | null {
  // ✅ ניסיון ראשון: מועמדים ישירים ממידלוורים
  const direct = [
    req.user?.id,
    req.user?.uid,
    resLocalUser(req)?.id,
    req.session?.user?.id,
    req.auth?.user?.id,
    req.headers["x-user-id"]
  ];
  for (const v of direct) {
    if (v) {
      const userId = String(v).trim();
      if (userId && userId.length > 0) {
        console.log("[early-register] Found userId from direct source:", userId);
        return userId;
      }
    }
  }

  // ✅ ניסיון שני: JWT מ-cookie/header (עובד עם UUID)
  try {
    const COOKIE_NAME = "session";
    const token = req.cookies?.[COOKIE_NAME] || 
                  req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
                  req.headers["x-auth-token"];
    
    if (token) {
      console.log("[early-register] Found token in cookies/headers");
      const decoded = decodeToken(token);
      
      if (decoded) {
        // ניסיון 1: מזהה ישיר מהטוקן (UUID או מספר)
        const directId = decoded.userId || decoded.id || decoded.sub || decoded.uid;
        if (directId) {
          const userId = String(directId).trim();
          if (userId && userId.length > 0) {
            console.log("[early-register] Found userId from JWT direct:", userId);
            return userId;
          }
        }

        // ניסיון 2: חיפוש לפי email (עובד גם עם UUID)
        const email = decoded.email || decoded.user?.email;
        if (email) {
          const user = db.prepare(`SELECT id FROM users WHERE email=? LIMIT 1`).get(email) as any;
          if (user && user.id) {
            const userId = String(user.id).trim();
            console.log("[early-register] Found userId from JWT email lookup:", userId);
            return userId;
          }
        }
      }
    }
  } catch (e) {
    console.log("[early-register] JWT decode failed:", e);
  }

  return null;
}

// ====== עזר: פתרון tournamentId אם חסר ======
function resolveTournamentId(req: any): string | null {
  // 1) נסה מה-body/query (מספר או UUID)
  const rawTournamentId = req.body?.tournamentId ?? req.body?.tournament_id ?? req.query?.tournamentId;
  if (rawTournamentId) {
    const tid = String(rawTournamentId).trim();
    if (tid && tid.length > 0) {
      // ודא שהטורניר קיים
      const exists = db.prepare(`SELECT id FROM tournaments WHERE id=? LIMIT 1`).get(tid) as any;
      if (exists && exists.id) {
        console.log("[early-register] Resolved tournamentId from body/query:", tid);
        return tid;
      }
    }
  }

  // 2) נסה לפי slug מהנתיב/גוף/שאילתה (אם יש עמודת slug בעתיד)
  const slug = req.params?.slug ?? req.body?.slug ?? req.query?.slug;
  if (slug && slug !== "default") {
    // אם יהיה slug בטבלה בעתיד, אפשר לחפש כאן
    // for now, skip this
  }

  // 3) נסה "הטורניר הפתוח האחרון" (registrationStatus = 'open')
  try {
    const open = db.prepare<[], { id: string } | undefined>(
      `SELECT id
       FROM tournaments
       WHERE registrationStatus IN ('open', 'upcoming')
       ORDER BY createdAt DESC
       LIMIT 1`
    ).get() as { id: string } | undefined;
    
    if (open && open.id) {
      console.log("[early-register] Resolved tournamentId from open tournament:", open.id);
      return String(open.id);
    }
  } catch (e) {
    console.log("[early-register] Failed to find open tournament:", e);
  }

  // 4) נסה "default" - הטורניר האחרון שנוצר
  try {
    const latest = db.prepare<[], { id: string } | undefined>(
      `SELECT id
       FROM tournaments
       ORDER BY createdAt DESC
       LIMIT 1`
    ).get() as { id: string } | undefined;
    
    if (latest && latest.id) {
      console.log("[early-register] Resolved tournamentId from latest tournament:", latest.id);
      return String(latest.id);
    }
  } catch (e) {
    console.log("[early-register] Failed to find latest tournament:", e);
  }

  return null;
}

function resLocalUser(req: any) {
  // לעיתים שומרים משתמש ב-res.locals.user או ב-app.locals.currentUser
  try { return req.res?.locals?.user || req.app?.locals?.currentUser; } catch { return null; }
}

router.post("/", (req, res) => {
  // ✅ פתרון אוטומטי של tournamentId אם חסר
  const tournamentId = resolveTournamentId(req);
  // ✅ גזירת userId מה-JWT/cookies (עובד עם UUID)
  const userId = deriveUserId(req);

  // לוג אבחוני מפורט
  console.log("[early-register] incoming:", {
    body: req.body,
    query: req.query,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    finalUserId: userId,
    finalTournamentId: tournamentId
  });

  if (!tournamentId || tournamentId.length === 0) {
    console.warn("[early-register] INVALID_TOURNAMENT_ID - could not resolve tournament");
    return res.status(400).json({ ok: false, error: "INVALID_TOURNAMENT_ID" });
  }
  if (!userId || userId.length === 0) {
    console.warn("[early-register] USER_NOT_AUTHENTICATED - could not derive userId");
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