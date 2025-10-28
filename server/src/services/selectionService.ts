// server/src/services/selectionService.ts
import Database from "better-sqlite3";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { insertNotification } from "../utils/notify.js";
import { createDbConnection } from "../db.js";

export type Stage = "R16" | "QF" | "SF" | "F";

export interface SelectionResult {
  stage: Stage;
  tournamentId: string;
  selected: Array<{ userId: string; email: string; displayName: string }>;
  total: number;
}

let db: Database.Database | null = null;
function getDb(): Database.Database {
  if (!db) {
    db = createDbConnection();
    db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS tournament_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        stage TEXT NOT NULL,             -- R16 | QF | SF | F
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(tournament_id, user_id, stage)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- אופציונלי: טבלת tournaments בסיסית אם אין (לוח זמנים לשלב)
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        starts_at TEXT,
        r16_at TEXT,
        qf_at TEXT,
        sf_at TEXT,
        f_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- עמודות אופציונליות ב-users אם חסרות
      -- display_name / rating / recent_activity / is_active
    `);
  }
  return db!;
}

function normalizeStage(stage: string): Stage {
  const s = stage.toUpperCase();
  if (!["R16", "QF", "SF", "F"].includes(s)) throw new Error("Invalid stage");
  return s as Stage;
}

// פונקציה זו הוסרה - המערכת לא תבחר שחקנים אוטומטית

/**
 * בחירה ידנית של שחקנים על ידי המנהל
 * המנהל בוחר בדיוק איזה שחקנים יקבלו מייל והודעה
 */
export async function selectPlayersManually(opts: {
  tournamentId: string;
  stage: Stage | string;
  selectedPlayerIds: string[]; // רשימת ID של שחקנים שנבחרו ידנית
  sendEmails?: boolean;
  createHomepageNotice?: boolean;
}): Promise<SelectionResult> {
  const db = getDb();
  const stage = normalizeStage(opts.stage);
  
  if (opts.selectedPlayerIds.length === 0) {
    throw new Error("חובה לבחור לפחות שחקן אחד");
  }

  // בדיקה שהשחקנים קיימים במערכת
  const players = db.prepare(`
    SELECT id, email, COALESCE(psnUsername, email, 'Player') AS display_name
    FROM users 
    WHERE id IN (${opts.selectedPlayerIds.map(() => '?').join(',')})
  `).all(...opts.selectedPlayerIds) as Array<{id: string, email: string, display_name: string}>;

  if (players.length !== opts.selectedPlayerIds.length) {
    throw new Error("חלק מהשחקנים שנבחרו לא קיימים במערכת");
  }

  // הוספת השחקנים לטורניר
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, stage)
    VALUES (?,?,?)
  `);
  
  const tx = db.transaction((playerIds: string[]) => {
    playerIds.forEach(playerId => insert.run(opts.tournamentId, playerId, stage));
  });
  tx(opts.selectedPlayerIds);

  // שליחת מיילים והתראות
  const emailPromises = [];
  for (const player of players) {
    if (opts.sendEmails !== false) {
      const link = `${process.env.SITE_URL || "https://www.fcmasterscup.com"}/tournaments/${opts.tournamentId}`;
      const subject = `נבחרת לטורניר – שלב ${stage} | FC Masters Cup`;
      const html = `
        <p>שלום ${player.display_name},</p>
        <p>נבחרת להשתתף בטורניר <b>FC Masters Cup</b> לשלב <b>${stage}</b>.</p>
        <p>לפרטים ולעדכונים:<br><a href="${link}">${link}</a></p>
        <p>בהצלחה! ⚽</p>
      `;
      emailPromises.push(
        sendEmail({ to: player.email, subject, html })
          .then(() => console.log(`📧 Email sent to: ${player.email}`))
          .catch((e) => console.error(`❌ Email error for ${player.email}:`, e))
      );
    }
    
    if (opts.createHomepageNotice !== false) {
      try {
        insertNotification(db, {
          userId: player.id,
          email: player.email,
          type: 'tournament_selected',
          title: `נבחרת לשלב ${stage}!`,
          body: `נבחרת לטורניר הקרוב (שלב ${stage}).`,
          payload: { tournamentId: opts.tournamentId, stage, link: `/tournaments/${opts.tournamentId}` }
        });
      } catch (error) {
        console.warn("⚠️ לא ניתן ליצור התראה:", error);
      }
    }
  }
  
  // המתן לכל המיילים להישלח
  await Promise.all(emailPromises);

  return {
    selected: players.map(p => ({
      userId: p.id,
      email: p.email,
      displayName: p.display_name
    })),
    stage,
    tournamentId: opts.tournamentId,
    total: players.length
  };
}

function defaultSlotsFor(stage: Stage): number {
  return stage === "R16" ? 16 : stage === "QF" ? 8 : stage === "SF" ? 4 : 2;
}

/**
 * אסטרטגיית בחירה:
 * - אם קיימת registrations(tournament_id,user_id,status) → בוחרים מאושרים בלבד.
 * - אחרת: כל users פעילים עם email.
 * - סידור לפי rating ו- recent_activity (יורד), ואז shuffle דטרמיניסטי לפי seed.
 * - שומר ב-tournament_participants, שולח מייל ויוצר התראות.
 */
export async function selectPlayersForStage(opts: {
  tournamentId: string;
  stage: Stage | string;
  slots?: number; // אם לא צוין — ברירת מחדל בהתאם לשלב
  sendEmails?: boolean;
  createHomepageNotice?: boolean;
}): Promise<SelectionResult> {
  const db = getDb();
  const stage = normalizeStage(opts.stage);
  const slots = Math.max(1, opts.slots ?? defaultSlotsFor(stage));

  const hasRegistrations = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='registrations';")
    .get();

  type Candidate = { user_id: string; email: string; display_name: string; rating?: number; recent_activity?: number };
  let candidates: Candidate[] = [];

  if (hasRegistrations) {
    candidates = db.prepare(`
      SELECT u.id AS user_id,
             u.email,
             COALESCE(u.psnUsername, u.email, 'Player') AS display_name,
             u.rating, u.recent_activity, u.payment_status
      FROM registrations r
      JOIN users u ON u.id = r.user_id
      WHERE r.tournament_id = ? AND r.status IN ('confirmed','approved') 
            AND u.email IS NOT NULL 
            AND u.payment_status = 'paid'
    `).all(opts.tournamentId) as Candidate[];
  } else {
    candidates = db.prepare(`
      SELECT id AS user_id,
             email,
             COALESCE(psnUsername, email, 'Player') AS display_name,
             rating, recent_activity, payment_status
      FROM users
      WHERE (is_active = 1 OR is_active IS NULL) 
            AND email IS NOT NULL 
            AND payment_status = 'paid'
    `).all() as Candidate[];
  }

  if (!candidates.length) {
    throw new Error("No eligible candidates found.");
  }

  // מי שכבר נבחרו לשלב – להוציא
  const already = db.prepare(`
    SELECT user_id FROM tournament_participants WHERE tournament_id=? AND stage=?
  `).all(opts.tournamentId, stage).map((r: any) => r.user_id);

  const pool = candidates.filter(c => !already.includes(c.user_id));
  if (!pool.length) throw new Error("All eligible players are already selected for this stage.");

  // המערכת לא תבחר שחקנים אוטומטית - המנהל יבחר ידנית
  // השארתי את הקוד הזה רק כדי לא לשבור את הפונקציה
  const selected = pool.slice(0, slots);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, stage)
    VALUES (?,?,?)
  `);
  const tx = db.transaction((rows: typeof selected) => {
    rows.forEach(r => insert.run(opts.tournamentId, String(r.user_id), stage));
  });
  tx(selected);

  // התראות ומיילים
  const emailPromises = [];
  for (const s of selected) {
    if (opts.sendEmails !== false) {
      const link = `${process.env.SITE_URL || "https://www.fcmasterscup.com"}/tournaments/${opts.tournamentId}`;
      const subject = `נבחרת לטורניר – שלב ${stage} | FC Masters Cup`;
      const html = `
        <p>שלום ${s.display_name},</p>
        <p>נבחרת להשתתף בטורניר <b>FC Masters Cup</b> לשלב <b>${stage}</b>.</p>
        <p>לפרטים ולעדכונים:<br><a href="${link}">${link}</a></p>
        <p>בהצלחה! ⚽</p>
      `;
      emailPromises.push(
        sendEmail({ to: s.email, subject, html })
          .then(() => console.log(`📧 Email sent to: ${s.email}`))
          .catch((e) => console.error(`❌ Email error for ${s.email}:`, e))
      );
    }
    if (opts.createHomepageNotice !== false) {
      try {
        insertNotification(db, {
          userId: s.user_id,
          email: s.email,
          type: 'tournament_selected',
          title: `נבחרת לשלב ${stage}!`,
          body: `נבחרת לטורניר הקרוב (שלב ${stage}).`,
          payload: { tournamentId: opts.tournamentId, stage, link: `/tournaments/${opts.tournamentId}` }
        });
      } catch (error) {
        console.warn("⚠️ לא ניתן ליצור התראה:", error);
      }
    }
  }
  
  // המתן לכל המיילים להישלח
  await Promise.all(emailPromises);

  return {
    stage,
    tournamentId: opts.tournamentId,
    selected: selected.map(x => ({ userId: x.user_id, email: x.email, displayName: x.display_name })),
    total: selected.length,
  };
}

/**
 * בחירת שחקנים ספציפיים לפי רשימת IDs
 */
export async function selectSpecificPlayers(opts: {
  tournamentId: string;
  stage: Stage | string;
  selectedUserIds: string[];
  sendEmails?: boolean;
  createHomepageNotice?: boolean;
}): Promise<SelectionResult> {
  const db = getDb();
  const stage = normalizeStage(opts.stage);

  // קבלת פרטי השחקנים שנבחרו
  const selectedUsers = db.prepare(`
    SELECT id AS user_id, email, COALESCE(psnUsername, email, 'Player') AS display_name
    FROM users
    WHERE id IN (${opts.selectedUserIds.map(() => '?').join(',')})
  `).all(...opts.selectedUserIds) as Array<{ user_id: string; email: string; display_name: string }>;

  if (selectedUsers.length === 0) {
    throw new Error("No eligible players found from the selected list.");
  }

  // בדיקה אם השחקנים כבר נבחרו לשלב
  const already = db.prepare(`
    SELECT user_id FROM tournament_participants WHERE tournament_id=? AND stage=?
  `).all(opts.tournamentId, stage).map((r: any) => r.user_id);

  const newSelections = selectedUsers.filter(u => !already.includes(u.user_id));
  if (newSelections.length === 0) {
    throw new Error("All selected players are already selected for this stage.");
  }

  // שמירה במסד הנתונים
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, stage)
    VALUES (?,?,?)
  `);
  const tx = db.transaction((rows: typeof newSelections) => {
    rows.forEach(r => insert.run(opts.tournamentId, String(r.user_id), stage));
  });
  tx(newSelections);

  // התראות ומיילים
  const emailPromises = [];
  for (const s of newSelections) {
    if (opts.sendEmails !== false) {
      const link = `${process.env.SITE_URL || "https://www.fcmasterscup.com"}/tournaments/${opts.tournamentId}`;
      const subject = `נבחרת לטורניר – שלב ${stage} | FC Masters Cup`;
      const html = `
        <p>שלום ${s.display_name},</p>
        <p>נבחרת להשתתף בטורניר <b>FC Masters Cup</b> לשלב <b>${stage}</b>.</p>
        <p>לפרטים ולעדכונים:<br><a href="${link}">${link}</a></p>
        <p>בהצלחה! ⚽</p>
      `;
      emailPromises.push(
        sendEmail({ to: s.email, subject, html })
          .then(() => console.log(`📧 Email sent to: ${s.email}`))
          .catch((e) => console.error(`❌ Email error for ${s.email}:`, e))
      );
    }
    if (opts.createHomepageNotice !== false) {
      try {
        insertNotification(db, {
          userId: s.user_id,
          email: s.email,
          type: 'tournament_selected',
          title: `נבחרת לשלב ${stage}!`,
          body: `נבחרת לטורניר הקרוב (שלב ${stage}).`,
          payload: { tournamentId: opts.tournamentId, stage, link: `/tournaments/${opts.tournamentId}` }
        });
      } catch (error) {
        console.warn("⚠️ לא ניתן ליצור התראה:", error);
      }
    }
  }
  
  // המתן לכל המיילים להישלח
  await Promise.all(emailPromises);

  return {
    stage,
    tournamentId: opts.tournamentId,
    selected: newSelections.map(x => ({ userId: x.user_id, email: x.email, displayName: x.display_name })),
    total: newSelections.length,
  };
}
