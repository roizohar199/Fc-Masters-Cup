// server/src/routes/manualBracket.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db.js";
import { notifyUser } from "../utils/notify.js";
import { requireAuth } from "../auth.js";

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
router.post("/api/admin/tournaments/create", requireAuth, async (req, res) => {
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
      const hasRegistrationStatus = safeHasColumn("tournaments", "registrationStatus");
      const hasRegistrationCapacity = safeHasColumn("tournaments", "registrationCapacity");
      const hasRegistrationMinPlayers = safeHasColumn("tournaments", "registrationMinPlayers");

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
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers 
          ? "title, game, platform, timezone, createdAt, prizeFirst, prizeSecond, nextTournamentDate, telegramLink, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "title, game, platform, timezone, createdAt, prizeFirst, prizeSecond, nextTournamentDate, telegramLink";
        const vals = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers 
          ? "?,?,?,?,?,?,?,?,?,'collecting',?,?"
          : "?,?,?,?,?,?,?,?,?";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
        params = hasRegistrationStatus ? [name, game, platformVal, timezoneVal, new Date().toISOString(), 500, 0, startsAt, null, 100, 16]
                                       : [name, game, platformVal, timezoneVal, new Date().toISOString(), 500, 0, startsAt, null];
      } else if (hasTitleCol && hasNameCol && hasPlatformCol && hasTimezoneCol) {
        // Both new and old schema fields
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers
          ? "name, title, game, platform, timezone, starts_at, current_stage, is_active, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "name, title, game, platform, timezone, starts_at, current_stage, is_active";
        const vals = hasRegistrationStatus ? "?,?,?,?,?,?,?,1,'collecting',100,16" : "?,?,?,?,?,?,?,1";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
        params = hasRegistrationStatus ? [name, name, game, platformVal, timezoneVal, startsAtISO, "R16"] 
                                       : [name, name, game, platformVal, timezoneVal, startsAtISO, "R16"];
      } else if (hasTitleCol && hasNameCol) {
        // Both name and title exist - no platform/timezone
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers
          ? "name, title, game, starts_at, current_stage, is_active, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "name, title, game, starts_at, current_stage, is_active";
        const vals = hasRegistrationStatus ? "?,?,?,?,?,1,'collecting',100,16" : "?,?,?,?,?,1";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
        params = [name, name, game, startsAtISO, "R16"];
      } else if (hasPlatformCol && hasTimezoneCol) {
        // Only platform and timezone exist
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers
          ? "name, game, platform, timezone, starts_at, current_stage, is_active, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "name, game, platform, timezone, starts_at, current_stage, is_active";
        const vals = hasRegistrationStatus ? "?,?,?,?,?,?,1,'collecting',100,16" : "?,?,?,?,?,?,1";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
        params = [name, game, platformVal, timezoneVal, startsAtISO, "R16"];
      } else if (hasPlatformCol) {
        // Only platform exists with name
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers
          ? "name, game, platform, starts_at, current_stage, is_active, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "name, game, platform, starts_at, current_stage, is_active";
        const vals = hasRegistrationStatus ? "?,?,?,?,?,1,'collecting',100,16" : "?,?,?,?,?,1";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
        params = [name, game, platformVal, startsAtISO, "R16"];
      } else {
        // Only name exists (new schema)
        const cols = hasRegistrationStatus && hasRegistrationCapacity && hasRegistrationMinPlayers
          ? "name, game, starts_at, current_stage, is_active, registrationStatus, registrationCapacity, registrationMinPlayers"
          : "name, game, starts_at, current_stage, is_active";
        const vals = hasRegistrationStatus ? "?,?,?,?,1,'collecting',100,16" : "?,?,?,?,1";
        insertSql = `INSERT INTO tournaments (${cols}) VALUES (${vals})`;
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

    // עדכן tournament_registrations למשתמשים שנבחרו - שנה את ה-state ל-'selected'
    const hasIdCol = (() => {
      try {
        const cols = db.prepare(`PRAGMA table_info(tournaments)`).all() as Array<{ name: string }>;
        return cols.some(c => c.name === "id");
      } catch { return false; }
    })();
    
    if (hasIdCol && tid) {
      // עדכן state ל-'selected' למשתמשים שנבחרו לטורניר הזה
      for (const userId of seeds) {
        try {
          db.prepare(`
            UPDATE tournament_registrations 
            SET state = 'selected', updatedAt = ?
            WHERE tournamentId = ? AND userId = ?
          `).run(nowISO(), tid, userId);
          
          // אם אין registration קיים, צור אחד חדש עם state='selected'
          const existing = db.prepare(`
            SELECT id FROM tournament_registrations WHERE tournamentId = ? AND userId = ?
          `).get(tid, userId);
          
          if (!existing) {
            db.prepare(`
              INSERT INTO tournament_registrations (id, tournamentId, userId, state, createdAt, updatedAt)
              VALUES (?, ?, ?, 'selected', ?, ?)
            `).run(uuid(), tid, userId, nowISO(), nowISO());
          }
        } catch (e) {
          console.error(`Failed to update registration for user ${userId}:`, e);
        }
      }
    }

    // יצירת התראות למשתמשים שנבחרו
    if (sendEmails) {
      try {
        const { uuid } = await import("../utils/ids.js");
        const { nowISO } = await import("../lib/util.js");
        const { sendTournamentSelectionEmail } = await import("../email.js");
        
        const rows = db.prepare(`SELECT id, email, psnUsername, display_name FROM users WHERE id IN (${placeholders})`).all(...seeds) as any[];
        
        for (const r of rows) {
          if (r.email && r.id) {
            const notificationId = uuid();
            const notificationData = {
              tournamentId: tid,
              tournamentTitle: name,
              tournamentDate: startsAt
            };

            // יצירת התראה במסד הנתונים עם הסכמה הנכונה
            try {
              db.prepare(`
                INSERT INTO notifications (id, userId, type, title, message, data, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(
                notificationId,
                r.id,
                'tournament_selection',
                `נבחרת להשתתף בטורניר: ${name}`,
                `מזל טוב! נבחרת להשתתף בטורניר "${name}". הטורניר יתחיל בקרוב - הישאר ערני לעדכונים!`,
                JSON.stringify(notificationData),
                nowISO()
              );
              console.log(where, "Notification created for user:", r.id);
            } catch (e) {
              console.warn(where, "Failed to insert notification:", (e as Error).message);
            }

            // שליחת מייל
            try {
              await sendTournamentSelectionEmail({
                userEmail: r.email,
                userName: r.psnUsername || r.display_name || r.email,
                tournamentTitle: name,
                tournamentDate: startsAt,
                telegramLink: undefined,
                prizeFirst: 500,
                prizeSecond: undefined
              });
            } catch (e) {
              console.warn(where, "Failed to send email:", (e as Error).message);
            }
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

// ----- helper: לזהות מזהה טורניר מכל צורה -----
function coerceTournamentId(req: any): number | null {
  // נסה ישירות מה-body (אם הוא אובייקט כבר):
  let raw =
    req?.body?.tournamentId ??
    req?.body?.id ??
    req?.body?.tid ??
    req?.query?.tournamentId ??
    req?.query?.id ??
    req?.query?.tid;

  // אם body הוא מחרוזת (למשל fetch בלי content-type) – ננסה לפענח JSON
  if (raw == null && typeof req?.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      raw = parsed?.tournamentId ?? parsed?.id ?? parsed?.tid;
    } catch {}
  }

  // אם קיבלנו מערך – נקח את הראשון
  if (Array.isArray(raw)) raw = raw[0];

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ----- advance stage -----
router.post("/api/admin/advance-stage", requireAuth, async (req, res) => {
  try {
    const tournamentId = coerceTournamentId(req);
    if (tournamentId == null) {
      return res
        .status(400)
        .json({ ok: false, error: "bad_request", reason: "invalid_tournament_id" });
    }

    // חיפוש גמיש: קודם לפי id (אם קיימת עמודה כזו), ואם לא – לפי rowid
    const hasIdCol = (() => {
      try {
        const cols = db.prepare(`PRAGMA table_info(tournaments)`).all() as Array<{ name: string }>;
        return cols.some(c => c.name === "id");
      } catch { return false; }
    })();

    let t: { id?: number; name?: string; current_stage?: string } | undefined;

    if (hasIdCol) {
      t = db.prepare(`SELECT id, name, current_stage FROM tournaments WHERE id = ?`).get(tournamentId) as any;
    }
    if (!t) {
      t = db.prepare(`SELECT rowid as id, name, current_stage FROM tournaments WHERE rowid = ?`).get(tournamentId) as any;
    }

    if (!t) {
      console.warn("[advance-stage] tournament_not_found", { tournamentId, hasIdCol });
      return res.status(404).json({ ok: false, error: "tournament_not_found" });
    }

    // קרא פרמטרים מהבקשה
    const { stage, selectedIds, sendEmails } = req.body || {};
    
    // קבע שלב יעד (אם לא נשלח – נגזור מהשלב הנוכחי)
    const stageNow = (t.current_stage || "R16").toUpperCase();
    const nextMap: Record<string, string> = { R16: "QF", QF: "SF", SF: "F", F: "FINISHED" };
    const to = String(req?.body?.to ?? stage ?? nextMap[stageNow] ?? stageNow).toUpperCase();

    // עדכון השלב (רק אם העמודה קיימת)
    try {
      const cols = db.prepare(`PRAGMA table_info(tournaments)`).all() as Array<{ name: string }>;
      if (cols.some(c => c.name === "current_stage")) {
        const whereCol = hasIdCol ? "id" : "rowid";
        db.prepare(`UPDATE tournaments SET current_stage = ? WHERE ${whereCol} = ?`).run(to, tournamentId);
      }
    } catch (e) {
      console.warn("[advance-stage] stage update warning:", (e as Error).message);
    }

    // מחק tournament_registrations למשתמשים שנבחרו (כדי שיוכלו להביע עניין בטורניר הבא)
    if (hasIdCol && Array.isArray(selectedIds) && selectedIds.length > 0) {
      // מחק registration למשתמשים שנבחרו לטורניר הזה
      for (const userId of selectedIds) {
        try {
          db.prepare(`DELETE FROM tournament_registrations WHERE tournamentId = ? AND userId = ?`).run(tournamentId, userId);
        } catch (e) {
          // אם אין registration - לא משנה
          console.warn(`[advance-stage] Could not delete registration for user ${userId}:`, (e as Error).message);
        }
      }
    }

    // יצירת התראות ומיילים לשחקנים שנבחרו
    
    if (stage && Array.isArray(selectedIds) && selectedIds.length > 0 && sendEmails) {
      const validStages = ["QF", "SF", "F"] as const;
      type Stage = typeof validStages[number];
      const validatedStage = stage as Stage;
      
      // בדיקת מספר נכון של שחקנים לכל שלב
      const requiredCounts: Record<Stage, number> = { QF: 8, SF: 4, F: 2 };
      
      if (!validStages.includes(validatedStage)) {
        return res.status(400).json({ ok: false, error: "invalid_stage" });
      }
      
      if (selectedIds.length !== requiredCounts[validatedStage]) {
        return res.status(400).json({ 
          ok: false, 
          error: "wrong_count", 
          expected: requiredCounts[validatedStage], 
          got: selectedIds.length 
        });
      }
      
      // Create notifications and send emails
      {
        const { uuid } = await import("../utils/ids.js");
        const { nowISO } = await import("../lib/util.js");
        const { sendTournamentSelectionEmail } = await import("../email.js");
        
        const placeholders = selectedIds.map(() => '?').join(',');
        const users = db.prepare(`SELECT id, email, psnUsername FROM users WHERE id IN (${placeholders})`).all(...selectedIds) as any[];
        
        const stageNames = { QF: "רבע גמר", SF: "חצי גמר", F: "גמר" };
        
        for (const user of users) {
          if (user.email && user.id) {
            const notificationId = uuid();
            
            try {
              db.prepare(`
                INSERT INTO notifications (id, userId, type, title, message, data, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(
                notificationId,
                user.id,
                'tournament_stage_advance',
                `התקדמת לשלב ${stageNames[validatedStage]}: ${t.name || `טורניר #${tournamentId}`}`,
                `מזל טוב! התקדמת לשלב ${stageNames[validatedStage]} בטורניר "${t.name || `טורניר #${tournamentId}`}". המשך להצליח!`,
                JSON.stringify({ tournamentId, stage: validatedStage }),
                nowISO()
              );
            } catch (e) {
              console.warn("[advance-stage] Failed to insert notification:", (e as Error).message);
            }

            try {
              await sendTournamentSelectionEmail({
                userEmail: user.email,
                userName: user.psnUsername || user.email,
                tournamentTitle: `${t.name || `טורניר #${tournamentId}`} - ${stageNames[validatedStage]}`,
                tournamentDate: undefined,
                telegramLink: undefined,
                prizeFirst: 500,
                prizeSecond: undefined
              });
            } catch (e) {
              console.warn("[advance-stage] Failed to send email:", (e as Error).message);
            }
          }
        }
      }
    }

    return res.json({ ok: true, tournamentId, from: stageNow, to });
  } catch (e: any) {
    console.error("[/api/admin/advance-stage] fatal:", (e as Error).message);
    return res.status(500).json({ ok: false, error: "internal_error", message: (e as Error).message });
  }
});

export default router;
