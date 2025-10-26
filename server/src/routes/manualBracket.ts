// server/src/routes/manualBracket.ts
import { Router } from "express";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { ensureSchema } from "../utils/ensureSchema.js";
import { notifyUser } from "../utils/notify.js";

const router = Router();
const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
ensureSchema(db);

// ---------- עזרי סכמה בטוחה ----------
function safeTableColumns(table: string): Array<{ name: string }> {
  try {
    return db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  } catch {
    return [];
  }
}
function tableHasColumns(table: string, cols: string[]) {
  const have = safeTableColumns(table).map(c => c.name);
  return cols.every(c => have.includes(c));
}
function listAllTables(): string[] {
  try {
    const rows = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as Array<{name:string}>;
    return rows.map(r => r.name);
  } catch { return []; }
}

// ---------- חיפוש user_id לפי מזהה חופשי ----------
function findUserIdInUsersByNumericId(nLike: string): number | null {
  const n = Number(nLike);
  if (!Number.isFinite(n)) return null;
  const row = db.prepare(`SELECT id FROM users WHERE id = ?`).get(n) as { id:number } | undefined;
  return row?.id ?? null;
}
function findUserIdInUsersByFields(idLike: string): number | null {
  // חיפוש ב־uuid/email/psn אם קיימים
  const allUserCols = safeTableColumns("users").map(c => c.name);
  console.log("[findUserIdInUsersByFields] Available users columns:", allUserCols);
  
  const candidates = ["uuid","public_id","user_uuid","external_id","uid","guid","email","psn"]
    .filter(c => tableHasColumns("users", [c]));
  console.log("[findUserIdInUsersByFields] Matching candidates:", candidates);
  
  for (const col of candidates) {
    console.log(`[findUserIdInUsersByFields] Checking column: ${col}`);
    const row = db.prepare(`SELECT id FROM users WHERE ${col} = ?`).get(idLike) as { id:number } | undefined;
    if (row?.id != null) {
      console.log(`[findUserIdInUsersByFields] Found in ${col}: user_id=${row.id}`);
      return row.id;
    }
  }
  return null;
}
function findUserIdInForeignTables(idLike: string): number | null {
  // מחפש בטבלאות שמכילות id + user_id (למשל registrations / tournament_registrations)
  const tables = listAllTables();
  console.log("[findUserIdInForeignTables] All tables:", tables);
  
  const relevantTables = tables.filter(t => tableHasColumns(t, ["id","user_id"]));
  console.log("[findUserIdInForeignTables] Tables with id+user_id:", relevantTables);
  
  for (const t of relevantTables) {
    console.log(`[findUserIdInForeignTables] Searching in table: ${t}`);
    const row = db.prepare(`SELECT user_id FROM ${t} WHERE id = ?`).get(idLike) as { user_id:number } | undefined;
    if (row?.user_id != null) {
      console.log(`[findUserIdInForeignTables] Found in ${t}: user_id=${row.user_id}`);
      return row.user_id;
    }
  }
  console.log("[findUserIdInForeignTables] Not found in any foreign table");
  return null;
}

function resolveOneIdentifier(idLike: string): number | null {
  console.log(`[resolveOneIdentifier] Trying to resolve: "${idLike}"`);
  try {
    // 1) users.id מספרי
    console.log(`[resolveOneIdentifier] Step 1: Trying numeric ID`);
    const a = findUserIdInUsersByNumericId(idLike);
    if (a != null) {
      console.log(`[resolveOneIdentifier] ✅ Found via numeric ID: ${a}`);
      return a;
    }

    // 2) users.<uuid/email/psn> אם קיימים
    console.log(`[resolveOneIdentifier] Step 2: Trying users fields`);
    const b = findUserIdInUsersByFields(idLike);
    if (b != null) {
      console.log(`[resolveOneIdentifier] ✅ Found via users fields: ${b}`);
      return b;
    }

    // 3) כל טבלה עם id + user_id (כמו registrations)
    console.log(`[resolveOneIdentifier] Step 3: Trying foreign tables`);
    const c = findUserIdInForeignTables(idLike);
    if (c != null) {
      console.log(`[resolveOneIdentifier] ✅ Found via foreign tables: ${c}`);
      return c;
    }

    console.log(`[resolveOneIdentifier] ❌ Not found anywhere for: "${idLike}"`);
    return null;
  } catch (err) {
    console.error("[resolveOneIdentifier] error:", (err as Error).message);
    return null;
  }
}

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

// ===== Utils קטנים לעבודה בטוחה עם הסכמה =====
function hasCol(table: string, col: string): boolean {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return cols.some(c => c.name === col);
  } catch { return false; }
}

router.get("/api/admin/users/list", (req, res) => {
  console.log("🔔 [/api/admin/users/list] Called with query:", req.query);
  try {
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 500)));
    console.log("📊 [/api/admin/users/list] Using limit:", limit);

    const fields: string[] = [`id AS userId`];
    if (hasCol("users", "email")) fields.push("email");
    if (hasCol("users", "display_name")) fields.push("display_name");
    if (hasCol("users", "psn")) fields.push("psn");
    if (hasCol("users", "status")) fields.push("status");
    
    console.log("📋 [/api/admin/users/list] Selected fields:", fields);

    const sql = `SELECT ${fields.join(", ")} FROM users LIMIT ?`;
    console.log("🔍 [/api/admin/users/list] SQL:", sql);
    
    const rows = db.prepare(sql).all(limit);
    console.log("✅ [/api/admin/users/list] Found rows:", rows.length);
    console.log("🔍 [/api/admin/users/list] Sample row:", rows[0]);

    const result = { ok: true, items: rows };
    console.log("📤 [/api/admin/users/list] Sending response:", JSON.stringify(result, null, 2));
    
    return res.json(result);
  } catch (e) {
    console.error("❌ [/api/admin/users/list] error:", (e as Error).message);
    console.error("❌ [/api/admin/users/list] stack:", (e as Error).stack);
    return res.status(500).json({ ok: false, error: "internal_error", message: (e as Error).message });
  }
});

// ---------- API: Debug DB structure ----------
router.get("/api/admin/debug/db-info", (req, res) => {
  try {
    const tables = listAllTables();
    const dbInfo: any = { tables: {} };
    
    for (const table of tables) {
      const cols = safeTableColumns(table);
      dbInfo.tables[table] = cols.map(c => c.name);
    }
    
    // Sample data from users table
    try {
      const sampleUsers = db.prepare("SELECT * FROM users LIMIT 3").all();
      dbInfo.sampleUsers = sampleUsers;
    } catch {}
    
    console.log("[DEBUG] DB Info:", JSON.stringify(dbInfo, null, 2));
    return res.json(dbInfo);
  } catch (e) {
    console.error("[DEBUG] DB Info error:", e);
    return res.status(500).json({ error: "internal_error" });
  }
});

// ---------- API: מיפוי מזהים → user_id ----------
router.post("/api/admin/users/resolve", (req, res) => {
  try {
    const identifiers = Array.isArray(req.body?.identifiers) ? req.body.identifiers : [];
    const cleaned = identifiers
      .map((x: any) => (x == null ? "" : String(x).trim()))
      .filter((s: string) => s.length > 0);

    console.log("[/api/admin/users/resolve] Input identifiers:", cleaned);

    const resolved: Array<{ input: string; userId: number }> = [];
    const unresolved: string[] = [];

    for (const input of cleaned) {
      const uid = resolveOneIdentifier(input);
      if (uid != null) resolved.push({ input, userId: uid });
      else unresolved.push(input);
    }

    console.log(
      "[/api/admin/users/resolve]",
      "in:", cleaned.length,
      "resolved:", resolved.length,
      "unresolved:", unresolved.length
    );
    console.log("[/api/admin/users/resolve] Final result:", { resolved, unresolved });

    return res.json({ ok: true, resolved, unresolved });
  } catch (e) {
    console.error("[/api/admin/users/resolve] fatal:", (e as Error).message);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

// (A) יצירת טורניר והצבה מיידית של 16 לשמינית — גרסה מוקשחת עם לוגים ברורים
router.post("/api/admin/tournaments/create", (req, res) => {
  const where = "[create]";
  try {
    let { name, game, startsAt, seeds16, sendEmails } = req.body || {};

    // --- נירמול קלט ---
    if (!Array.isArray(seeds16)) seeds16 = [];
    
    // מקבלים user_ids מספריים מהלקוח ישירות
    const seeds: number[] = Array.from(
      new Set(
        (seeds16 as any[]).map((x) => Number(x)).filter((n) => Number.isFinite(n))
      )
    );

    if (!name || !game || !startsAt) {
      console.error(where, "bad_request missing fields", { name, game, startsAt });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "missing_fields" });
    }
    if (seeds.length !== 16) {
      console.error(where, "need_16_players", { rawCount: (seeds16 || []).length, cleanedCount: seeds.length, seeds16 });
      return res.status(400).json({
        ok: false,
        error: "bad_request",
        reason: "need_16_players",
        rawCount: (seeds16 || []).length,
        cleanedCount: seeds.length,
      });
    }

    // בדיקת קיום ב-DB
    const placeholders = seeds.map(() => "?").join(",");
    const exists = db.prepare(`SELECT id FROM users WHERE id IN (${placeholders})`).all(...seeds) as Array<{ id: number }>;
    const foundIds = new Set(exists.map(r => r.id));
    const missing = seeds.filter(id => !foundIds.has(id));
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
