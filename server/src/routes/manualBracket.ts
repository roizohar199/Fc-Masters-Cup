// server/src/routes/manualBracket.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db.js";
import { notifyUser } from "../utils/notify.js";

const router = Router();

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

// נוקה - פונקציות שלא נחוצות יותר

// נוקה - SSE לא נחוץ למבנה הפשוט

// עזר: הבאת פרטי טורניר
function getTournament(tid: number) {
  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tid);
  return t;
}

// --- API ---

// ===== Utils קטנים לעבודה בטוחה עם הסכמה =====
function hasCol(table: string, col: string): boolean {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return cols.some(c => c.name === col);
  } catch { return false; }
}

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

// מחיקת endpoint שלא נחוץ יותר

// (A) יצירת טורניר והצבה מיידית של 16 לשמינית — גרסה מוקשחת עם לוגים ברורים
router.post("/api/admin/tournaments/create", (req, res) => {
  const where = "[create]";
  try {
    let { name, game, startsAt, seeds16, sendEmails } = req.body || {};
    if (!Array.isArray(seeds16)) seeds16 = [];

    // ניקוי/ייחוד מספרי
    const seeds = Array.from(new Set((seeds16 as any[]).map(Number).filter(Number.isFinite)));
    if (!name || !game || !startsAt) {
      console.error(where, "missing fields", { name, game, startsAt });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "missing_fields" });
    }
    if (seeds.length !== 16) {
      console.error(where, "need_16_players", { got: seeds.length, seeds });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "need_16_players", got: seeds.length });
    }

    // בדוק קיום ids
    const placeholders = seeds.map(() => "?").join(",");
    const exists = db.prepare(`SELECT id FROM users WHERE id IN (${placeholders})`).all(...seeds) as Array<{id:number}>;
    const found = new Set(exists.map(r => r.id));
    const missing = seeds.filter(x => !found.has(x));
    if (missing.length) {
      console.error(where, "users_not_found", { missing });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "users_not_found", missing });
    }

    const tid = db.transaction(() => {
      // הכנסה לטבלת tournaments – עכשיו יש בטוח name/game/starts_at/current_stage/is_active
      const info = db.prepare(
        `INSERT INTO tournaments (name, game, starts_at, current_stage, is_active)
         VALUES (?,?,?,?,1)`
      ).run(name, game, String(startsAt), "R16");
      const tournamentId = Number(info.lastInsertRowid);

      // שיוך שחקנים לשמינית
      const insTP = db.prepare(
        `INSERT INTO tournament_players (tournament_id, user_id, stage, is_selected)
         VALUES (?,?,?,1)`
      );
      for (const uid of seeds) insTP.run(tournamentId, uid, "R16");

      // 8 משחקי R16: (1-2), (3-4), ...
      const insM = db.prepare(
        `INSERT INTO matches (tournament_id, round, pos, p1_user_id, p2_user_id)
         VALUES (?,?,?,?,?)`
      );
      for (let i = 0; i < 8; i++) {
        insM.run(tournamentId, "R16", i + 1, seeds[i * 2], seeds[i * 2 + 1]);
      }
      return tournamentId;
    })();

    // (אופציונלי) שליחת מיילים/התראות – עטוף ב-try לוגי בלבד
    if (sendEmails) {
      try {
        const rows = db.prepare(`SELECT id, email, display_name FROM users WHERE id IN (${placeholders})`).all(...seeds) as any[];
        for (const r of rows) {
          if (r.email) {
            notifyUser({
              db,
              userId: null, // לא משתמש ב-userId כיוון שיש בעיות עם UUIDs/numbers
              email: r.email,
              title: `נבחרת לטורניר ${name}`,
              body: `שלום ${r.display_name || r.email || ""},<br/>נבחרת לטורניר ${name}. מועד: ${new Date(
                startsAt
              ).toLocaleString("he-IL")}.`,
            });
          }
        }
      } catch (e) {
        console.warn(where, "notify skipped:", (e as Error).message);
      }
    }

    return res.json({ ok: true, tournamentId: tid });
  } catch (e) {
    console.error("[/api/admin/tournaments/create] fatal:", (e as Error).message);
    return res.status(500).json({ ok: false, error: "internal_error", message: (e as Error).message });
  }
});

// הוסר - endpoint לא רלוונטי למבנה הקיים

// נוקה - endpoints לא רלוונטיים למבנה הקיים

export default router;
