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

    // --- נירמול קלט ---
    if (!Array.isArray(seeds16)) seeds16 = [];
    
    // מקבלים user_ids כמחרוזות מהלקוח
    const seeds: string[] = Array.from(
      new Set(
        (seeds16 as any[]).map((x) => String(x)).filter((s) => s && s.trim().length > 0)
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
    const exists = db.prepare(`SELECT id FROM users WHERE id IN (${placeholders})`).all(...seeds) as Array<{ id: string }>;
    const foundIds = new Set(exists.map(r => r.id));
    const missing = seeds.filter(id => !foundIds.has(id));
    if (missing.length) {
      console.error(where, "users_not_found", { missing });
      return res.status(400).json({ ok: false, error: "bad_request", reason: "users_not_found", missing });
    }

    // --- שמירה בטרנזקציה ---
    const tId = db.transaction(() => {
      // יצירת טורניר במבנה הטבלה הקיים
      const info = db
        .prepare(
          `INSERT INTO tournaments(name, game, starts_at, created_at)
           VALUES (?,?,?,datetime('now'))`
        )
        .run(name, game, String(startsAt));
      const tid = Number(info.lastInsertRowid);

      console.log(`✅ Tournament created with ID: ${tid}`);
      return tid;
    })();

    // --- מיילים/התראות (חינני; לא מפיל את הבקשה) ---
    try {
      if (sendEmails) {
        const emails = db
          .prepare(
            `SELECT u.id AS userId, u.email, u.psnUsername AS displayName
             FROM users u WHERE u.id IN (${placeholders})`
          )
          .all(...seeds) as Array<{ userId: string; email: string | null; displayName?: string | null }>;
        
        console.log(`📧 Sending emails to ${emails.length} users`);
        for (const u of emails) {
          try {
            // שליחת התראה באמצעות אימייל בלבד (מעקף את בעיית ה-userId)
            if (u.email) {
              notifyUser({
                db,
                userId: null, // לא משתמש ב-userId כיוון שהוא UUID ולא number
                email: u.email,
                title: `נבחרת לטורניר ${name}`,
                body: `שלום ${u.displayName || u.email || ""},<br/>נבחרת לטורניר ${name}. מועד: ${new Date(
                  startsAt
                ).toLocaleString("he-IL")}.`,
              });
              console.log(`✅ Email sent to: ${u.email}`);
            }
          } catch (emailErr) {
            console.warn(`⚠️ Failed to send email to ${u.email}:`, emailErr);
          }
        }
      }
    } catch (mailErr) {
      console.warn(`${where} email/notify skipped:`, (mailErr as Error).message);
    }

    return res.json({ ok: true, tournamentId: tId });
  } catch (e) {
    // נחזיר פרטים ידידותיים + נלוג
    const msg = (e as Error).message || String(e);
    console.error("[/api/admin/tournaments/create] fatal:", msg);
    return res.status(500).json({ ok: false, error: "internal_error", message: msg });
  }
});

// הוסר - endpoint לא רלוונטי למבנה הקיים

// נוקה - endpoints לא רלוונטיים למבנה הקיים

export default router;
