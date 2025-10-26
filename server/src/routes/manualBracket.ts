// server/src/routes/manualBracket.ts
import { Router } from "express";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { ensureSchema } from "../utils/ensureSchema.js";
import { notifyUser } from "../utils/notify.js";

const router = Router();
const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
ensureSchema(db);

// --- SSE ---
type Client = { id: string; res: any };
const streams = new Map<number, Set<Client>>();
function broadcast(tid: number, payload: any) {
  const s = streams.get(tid); if (!s) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const c of s) { try { c.res.write(data); } catch { } }
}

// עזר: הבאת מצב מלא
function getBracket(tid: number) {
  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tid);
  if (!t) return null;
  const participants = db.prepare(`
    SELECT tp.stage, tp.is_selected, tp.result,
           u.id AS userId, u.display_name AS displayName, u.email, u.psn
    FROM tournament_players tp
    LEFT JOIN users u ON u.id = tp.user_id
    WHERE tp.tournament_id=?
    ORDER BY tp.stage ASC, u.display_name COLLATE NOCASE
  `).all(tid);

  const matches = db.prepare(`
    SELECT id, round, pos, p1_user_id AS p1, p2_user_id AS p2, winner_user_id AS winner
    FROM matches
    WHERE tournament_id=?
    ORDER BY 
      CASE round WHEN 'R16' THEN 1 WHEN 'QF' THEN 2 WHEN 'SF' THEN 3 WHEN 'F' THEN 4 ELSE 9 END,
      pos ASC
  `).all(tid);

  return { tournament: t, participants, matches };
}

// --- API ---

// (A) יצירת טורניר והצבה מיידית של 16 לשמינית — גרסה מוקשחת עם לוגים ברורים
router.post("/api/admin/tournaments/create", (req, res) => {
  const where = "[create]";
  try {
    let { name, game, startsAt, seeds16, sendEmails } = req.body || {};

    // --- נירמול קלט ---
    if (!Array.isArray(seeds16)) seeds16 = [];

    // === נירמול ל-strings (UUID/מספר) והסרת ריקים ===
    const seedsRaw: string[] = (seeds16 as any[]).map((x) => (x == null ? "" : String(x).trim()));
    const seeds: string[] = Array.from(new Set(seedsRaw.filter((s) => s.length > 0)));

    if (!name || !game || !startsAt) {
      console.error(where, "bad_request missing fields", { name, game, startsAt });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "missing_fields" });
    }
    if (seeds.length !== 16) {
      console.error(where, "need_16_players", { rawCount: seedsRaw.length, cleanedCount: seeds.length, seedsRaw });
      return res.status(400).json({
        ok: false,
        error: "bad_request",
        reason: "need_16_players",
        rawCount: seedsRaw.length,
        cleanedCount: seeds.length,
      });
    }

    // בדיקת קיום ב-DB (id כטקסט/UUID או מספר – הכול עובד בפרמטרים)
    const placeholders = seeds.map(() => "?").join(",");
    const exists = db
      .prepare(`SELECT id FROM users WHERE id IN (${placeholders})`)
      .all(...seeds) as Array<{ id: string }>;
    const foundIds = new Set(exists.map((r) => String(r.id)));
    const missing = seeds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      console.error(where, "users_not_found", { missing });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "users_not_found", missing });
    }

    // --- שמירה בטרנזקציה ---
    const tId = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO tournaments(name, game, starts_at, current_stage, is_active)
           VALUES (?,?,?,?,1)`
        )
        .run(name, game, String(startsAt), "R16");
      const tid = Number(info.lastInsertRowid);

      // טבלת שיוכים לשלב (R16)
      const insTP = db.prepare(
        `INSERT INTO tournament_players(tournament_id, user_id, stage, is_selected)
         VALUES (?,?,?,1)`
      );
      seeds.forEach((uid) => insTP.run(tid, uid, "R16"));

      // בניית 8 משחקי שמינית: (1-2), (3-4), ...
      const insM = db.prepare(
        `INSERT INTO matches(tournament_id, round, pos, p1_user_id, p2_user_id)
         VALUES (?,?,?,?,?)`
      );
      for (let i = 0; i < 8; i++) {
        insM.run(tid, "R16", i + 1, seeds[i * 2], seeds[i * 2 + 1]);
      }

      return tid;
    })();

    // --- מיילים/התראות (חינני; לא מפיל את הבקשה) ---
    try {
      if (sendEmails) {
        const emails = db
          .prepare(
            `SELECT u.id AS userId, u.email, u.display_name AS displayName
             FROM users u WHERE u.id IN (${placeholders})`
          )
          .all(...seeds) as Array<{ userId: number; email: string | null; displayName?: string | null }>;
        for (const u of emails) {
          notifyUser({
            db,
            userId: u.userId,
            email: u.email || undefined,
            title: `נבחרת לטורניר ${name}`,
            body: `שלום ${u.displayName || u.email || ""},<br/>נבחרת לשמינית הגמר. מועד: ${new Date(
              startsAt
            ).toLocaleString("he-IL")}.`,
          });
        }
      }
    } catch (mailErr) {
      console.warn(`${where} email/notify skipped:`, (mailErr as Error).message);
    }

    const bracket = getBracket(tId);
    broadcast(tId, { type: "bracket", bracket });
    return res.json({ ok: true, tournamentId: tId, bracket });
  } catch (e) {
    // נחזיר פרטים ידידותיים + נלוג
    const msg = (e as Error).message || String(e);
    console.error("[/api/admin/tournaments/create] fatal:", msg);
    return res.status(500).json({ ok: false, error: "internal_error", message: msg });
  }
});

// (B) שמירת שלב (R16/QF/SF/F) עם רשימת userIds (בזוגות סדריים)
router.post("/api/admin/tournaments/:id/assign", (req, res) => {
  try {
    const tid = Number(req.params.id);
    const round = String(req.body?.round || '').toUpperCase(); // R16|QF|SF|F
    const userIds: number[] = req.body?.userIds || [];

    const expected = round === "R16" ? 16 : round === "QF" ? 8 : round === "SF" ? 4 : round === "F" ? 2 : 0;
    if (!tid || !expected || userIds.length !== expected) {
      return res.status(400).json({ ok: false, error: "bad_request" });
    }

    db.transaction(() => {
      // נקה והכנס מחדש את משחקי השלב
      db.prepare(`DELETE FROM matches WHERE tournament_id=? AND round=?`).run(tid, round);
      const insM = db.prepare(`INSERT INTO matches(tournament_id, round, pos, p1_user_id, p2_user_id, updated_at) VALUES (?,?,?,?,?,datetime('now'))`);
      for (let i = 0; i < userIds.length/2; i++) insM.run(tid, round, i+1, userIds[i*2], userIds[i*2+1]);

      // עדכן טבלת שיוכים (tournament_players)
      db.prepare(`DELETE FROM tournament_players WHERE tournament_id=? AND stage=?`).run(tid, round);
      const insTP = db.prepare(`INSERT INTO tournament_players(tournament_id, user_id, stage, is_selected) VALUES (?,?,?,1)`);
      userIds.forEach(uid => insTP.run(tid, uid, round));

      // עדכן current_stage
      db.prepare(`UPDATE tournaments SET current_stage=? WHERE id=?`).run(round, tid);
    })();

    const bracket = getBracket(tid);
    broadcast(tid, { type: "bracket", bracket });

    // התראות/מיילים (אופציונלי)
    try {
      const emails = db.prepare(`
        SELECT u.id AS userId, u.email, u.display_name AS displayName
        FROM users u WHERE u.id IN (${userIds.map(() => "?").join(",")})
      `).all(...userIds) as Array<{ userId: number; email: string | null; displayName?: string | null }>;
      
      for (const u of emails) {
        notifyUser({
          db, userId: u.userId, email: u.email || undefined,
          title: `עודכנת לשלב ${round}`,
          body: `שלום ${u.displayName || u.email}, עודכנת לשלב ${round} בטורניר. פתח את האתר כדי לראות מול מי אתה משחק.`,
        });
      }
    } catch {}

    return res.json({ ok: true, bracket });
  } catch (e) {
    console.error("[assign] error", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

// (C) קביעת מנצח למשחק
router.post("/api/admin/tournaments/:id/match/:mid/winner", (req, res) => {
  try {
    const tid = Number(req.params.id);
    const mid = Number(req.params.mid);
    const winner = Number(req.body?.winnerUserId);
    if (!tid || !mid || !winner) return res.status(400).json({ ok: false, error: "bad_request" });

    db.prepare(`UPDATE matches SET winner_user_id=?, updated_at=datetime('now') WHERE id=? AND tournament_id=?`)
      .run(winner, mid, tid);

    const bracket = getBracket(tid);
    broadcast(tid, { type: "bracket", bracket });
    return res.json({ ok: true, bracket });
  } catch (e) {
    console.error("[winner] error", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

// (D) API ציבורי – בראקט ומדיה
router.get("/api/tournaments/:id/bracket", (req,res)=>{
  const b = getBracket(Number(req.params.id));
  if (!b) return res.status(404).json({ ok:false, error:'not_found' });
  res.json({ ok:true, ...b });
});

// (E) SSE – סטרים לעדכון חי
router.get("/api/tournaments/:id/stream", (req,res)=>{
  const tid = Number(req.params.id); if (!tid) return res.status(400).end();
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");
  res.flushHeaders?.();
  const id = randomUUID();
  const c: Client = { id, res };
  if (!streams.has(tid)) streams.set(tid, new Set());
  streams.get(tid)!.add(c);

  const bracket = getBracket(tid);
  res.write(`data: ${JSON.stringify({ type:"bracket", bracket })}\n\n`);

  req.on("close", ()=> streams.get(tid)?.delete(c));
});

export default router;
