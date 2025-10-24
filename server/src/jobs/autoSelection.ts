// server/src/jobs/autoSelection.ts
import cron from "node-cron";
import Database from "better-sqlite3";
import { selectPlayersForStage, Stage } from "../services/selectionService.js";

/**
 * קריטריון הפעלה:
 * - אם יש timestamps בטבלת tournaments (r16_at/qf_at/sf_at/f_at) והזמן עבר – נבצע בחירה לשלב הרלוונטי.
 * - אם אין timestamps: נפעיל לוגיקה "חכמה" ברירת מחדל:
 *    * אם אין R16 לטורניר → ננסה לבחור 16.
 *    * אם נוצר R16 ויש תוצאות/התקדמות (לא מטופל כאן) אפשר להשאיר ידני או לחבר ללוגיקת נוקאאוט אצלך.
 *
 * הג'וב רץ כל 5 דק'. בטוח להרצה חוזרת – כי אנחנו INSERT OR IGNORE ולא בוחרים שחקנים שכבר נבחרו.
 */

function getDb() {
  const db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
  db.pragma("journal_mode = WAL");
  return db;
}

function stageKeyToSlots(stage: Stage) {
  return stage === "R16" ? 16 : stage === "QF" ? 8 : stage === "SF" ? 4 : 2;
}

function needSelectionForStage(db: Database.Database, tId: number, stage: Stage): boolean {
  const row = db.prepare(`
    SELECT COUNT(*) AS cnt FROM tournament_participants WHERE tournament_id=? AND stage=?
  `).get(tId, stage) as { cnt: number };
  return (row?.cnt || 0) < stageKeyToSlots(stage);
}

function trySelectBySchedule() {
  const db = getDb();

  const tournaments = db.prepare(`
    SELECT id, r16_at, qf_at, sf_at, f_at FROM tournaments ORDER BY id DESC
  `).all() as Array<{id:number,r16_at?:string,qf_at?:string,sf_at?:string,f_at?:string}>;

  const now = Date.now();

  for (const t of tournaments) {
    const entries: Array<[Stage, string|undefined]> = [
      ["R16", t.r16_at],
      ["QF",  t.qf_at],
      ["SF",  t.sf_at],
      ["F",   t.f_at],
    ];

    for (const [stage, at] of entries) {
      if (!at) continue;
      const ts = Date.parse(at);
      if (isNaN(ts)) continue;
      if (ts <= now && needSelectionForStage(db, t.id, stage)) {
        try {
          selectPlayersForStage({ tournamentId: t.id, stage, sendEmails: true, createHomepageNotice: true });
          console.log(`[autoSelection] Selected for t=${t.id} stage=${stage}`);
        } catch (e) {
          console.error(`[autoSelection] Failed t=${t.id} stage=${stage}:`, (e as any)?.message);
        }
      }
    }

    // אם אין לו זמנים בכלל – נסה לבחור R16 פעם אחת:
    if (!t.r16_at && !t.qf_at && !t.sf_at && !t.f_at) {
      if (needSelectionForStage(db, t.id, "R16")) {
        try {
          selectPlayersForStage({ tournamentId: t.id, stage: "R16", sendEmails: true, createHomepageNotice: true });
          console.log(`[autoSelection] Default R16 for t=${t.id}`);
        } catch (e) {
          console.error(`[autoSelection] Default R16 failed t=${t.id}:`, (e as any)?.message);
        }
      }
    }
  }

  db.close();
}

// ריצה כל 5 דקות
export function startAutoSelectionJob() {
  cron.schedule("*/5 * * * *", trySelectBySchedule, { timezone: process.env.TZ || "Asia/Jerusalem" });
  console.log("[autoSelection] cron started (*/5 * * * *).");
}
