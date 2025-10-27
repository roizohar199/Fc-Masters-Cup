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
router.post("/api/admin/tournaments/create", async (req, res) => {
  const where = "[create]";
  try {
    let { name, game, startsAt, seeds16, sendEmails } = req.body || {};
    if (!Array.isArray(seeds16)) seeds16 = [];

    console.log(where, "Received seeds16:", seeds16);
    
    // ניקוי/ייחוד - keep as strings (UUIDs)
    const seeds = Array.from(new Set((seeds16 as any[]).filter(s => s && typeof s === 'string')));
    console.log(where, "Processed seeds:", seeds);
    
    if (!name || !game || !startsAt) {
      console.error(where, "missing fields", { name, game, startsAt });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "missing_fields" });
    }
    if (seeds.length !== 16) {
      console.error(where, "need_16_players", { got: seeds.length, seeds });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "need_16_players", got: seeds.length });
    }

    // בדוק קיום ids - update type to handle UUID strings
    const placeholders = seeds.map(() => "?").join(",");
    const exists = db.prepare(`SELECT id FROM users WHERE id IN (${placeholders})`).all(...seeds) as Array<{id:string}>;
    const found = new Set(exists.map(r => r.id));
    const missing = seeds.filter(x => !found.has(x));
    if (missing.length) {
      console.error(where, "users_not_found", { missing });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "users_not_found", missing });
    }

    // Import utilities outside transaction
    const { uuid, genToken, genPin } = await import("../utils/ids.js");
    const { nowISO } = await import("../lib/util.js");

    const tid = db.transaction(() => {
      // Helper function to check columns
      function safeHasColumn(table: string, column: string): boolean {
        try {
          const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
          return cols.some((c) => c.name === column);
        } catch {
          return false;
        }
      }

      const startsAtISO = String(startsAt);
      const hasTitleCol = safeHasColumn("tournaments", "title");
      const hasNameCol = safeHasColumn("tournaments", "name");
      const hasPlatformCol = safeHasColumn("tournaments", "platform");
      const hasTimezoneCol = safeHasColumn("tournaments", "timezone");
      const hasCreatedAtCol = safeHasColumn("tournaments", "createdAt");

      // פלטפורמה: אם לא נשלחה מהקליינט – נגדיר ערך סביר
      const platformVal = "ps5"; // Default platform
      const timezoneVal = "Asia/Jerusalem"; // Default timezone

      // If has title column (sometimes NOT NULL) - fill it with same value as name
      let insertSql: string;
      let params: any[];
      let tournamentId: string;

      // התמודדות עם הסכמות השונות
      if (hasTitleCol && hasPlatformCol && hasTimezoneCol && hasCreatedAtCol) {
        // Old schema with all required fields
        insertSql = `INSERT INTO tournaments (title, game, platform, timezone, createdAt, prizeFirst, prizeSecond, nextTournamentDate, telegramLink)
                     VALUES (?,?,?,?,?,?,?,?,?)`;
        params = [name, game, platformVal, timezoneVal, new Date().toISOString(), 500, 0, startsAt, null];
      } else if (hasTitleCol && hasNameCol && hasPlatformCol && hasTimezoneCol) {
        // Both new and old schema fields
        insertSql = `INSERT INTO tournaments (name, title, game, platform, timezone, starts_at, current_stage, is_active)
                     VALUES (?,?,?,?,?,?,?,1)`;
        params = [name, name, game, platformVal, timezoneVal, startsAtISO, "R16"];
      } else if (hasTitleCol && hasNameCol) {
        // Both name and title exist - no platform/timezone
        insertSql = `INSERT INTO tournaments (name, title, game, starts_at, current_stage, is_active)
                     VALUES (?,?,?,?,?,1)`;
        params = [name, name, game, startsAtISO, "R16"];
      } else if (hasPlatformCol && hasTimezoneCol) {
        // Only platform and timezone exist
        insertSql = `INSERT INTO tournaments (name, game, platform, timezone, starts_at, current_stage, is_active)
                     VALUES (?,?,?,?,?,?,1)`;
        params = [name, game, platformVal, timezoneVal, startsAtISO, "R16"];
      } else if (hasPlatformCol) {
        // Only platform exists with name
        insertSql = `INSERT INTO tournaments (name, game, platform, starts_at, current_stage, is_active)
                     VALUES (?,?,?,?,?,1)`;
        params = [name, game, platformVal, startsAtISO, "R16"];
      } else {
        // Only name exists (new schema)
        insertSql = `INSERT INTO tournaments (name, game, starts_at, current_stage, is_active)
                     VALUES (?,?,?,?,1)`;
        params = [name, game, startsAtISO, "R16"];
      }

      const info = db.prepare(insertSql).run(...params);
      tournamentId = String(info.lastInsertRowid);
      
      console.log(where, "Created tournament with ID:", tournamentId);

      // שיוך שחקנים לשמינית - check if tournament_players table exists
      const hasTournamentPlayers = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='tournament_players'`).get();
      
      if (hasTournamentPlayers) {
        const insTP = db.prepare(
          `INSERT OR IGNORE INTO tournament_players (tournament_id, user_id, stage, is_selected)
           VALUES (?,?,?,1)`
        );
        for (const uid of seeds) insTP.run(Number(tournamentId), Number(uid), "R16");
      }

      // 8 משחקי R16: (1-2), (3-4), ...
      // Check if matches table has old schema or new schema
      const hasMatchesOld = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='matches'`).get();
      const hasNewSchema = db.prepare(`PRAGMA table_info(matches)`).all().some((col: any) => col.name === 'tournamentId');
      
      if (hasNewSchema) {
        // New schema with tournamentId, homeId, awayId
        const insM = db.prepare(
          `INSERT INTO matches (id, tournamentId, round, homeId, awayId, status, token, pin, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?)`
        );
        
        for (let i = 0; i < 8; i++) {
          const matchId = uuid();
          insM.run(
            matchId,
            tournamentId, 
            "R16", 
            seeds[i * 2], 
            seeds[i * 2 + 1], 
            "PENDING", 
            genToken(), 
            genPin(),
            nowISO()
          );
        }
      } else if (hasMatchesOld) {
        // Old schema with tournament_id, p1_user_id, p2_user_id
        const insM = db.prepare(
          `INSERT INTO matches (tournament_id, round, pos, p1_user_id, p2_user_id)
           VALUES (?,?,?,?,?)`
        );
        
        for (let i = 0; i < 8; i++) {
          insM.run(
            Number(tournamentId),
            "R16", 
            i + 1, 
            Number(seeds[i * 2]), 
            Number(seeds[i * 2 + 1])
          );
        }
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
