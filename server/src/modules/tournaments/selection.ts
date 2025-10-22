import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNotification } from "../notifications/model.js";
import { sendMailSafe, tournamentSelectionTemplate } from "../mail/mailer.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../tournaments.sqlite");
const db = new Database(DB_PATH);

export function selectParticipants(tournamentId: string, userIds: string[]) {
  const now = new Date().toISOString();
  const update = db.prepare(`
    UPDATE tournament_registrations
    SET selected_at = ?
    WHERE tournamentId = ? AND userId = ?`);
  const getUser = db.prepare(`SELECT id, email, psnUsername FROM users WHERE id=?`);
  const getTournament = db.prepare(`SELECT id, title, createdAt FROM tournaments WHERE id=?`);
  
  const t = db.transaction((ids: string[]) => {
    const tRow = getTournament.get(tournamentId) as any;
    for (const uid of ids) {
      update.run(now, tournamentId, uid);
      const u = getUser.get(uid) as any;
      
      // התראה לפופאפ
      createNotification(
        uid,
        "נבחרת לטורניר",
        `נבחרת להשתתף בטורניר "${tRow?.title ?? ""}". בהצלחה!`,
        "tournament"
      );
      
      // שליחת מייל
      const ctaUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/bracket`;
      const html = tournamentSelectionTemplate({
        userName: u?.psnUsername || undefined,
        tournamentName: tRow?.title ?? "FC Masters Cup",
        startsAt: tRow?.createdAt || undefined,
        ctaUrl
      });
      
      // לא חוסם את הטרנזקציה – נשלח אחרי
      queueEmail(u.email, `נבחרת לטורניר ${tRow?.title ?? ""}`, html);
    }
  });
  t(userIds);
}

const emailQueue: Array<{to:string, subject:string, html:string}> = [];
function queueEmail(to: string, subject: string, html: string) {
  emailQueue.push({to, subject, html});
}

// קריאה מהקרון/טיימר לשלוח בפועל
export async function flushEmailQueue() {
  while (emailQueue.length) {
    const m = emailQueue.shift()!;
    try { 
      await sendMailSafe(m.to, m.subject, m.html); 
      console.log(`📧 Email sent to: ${m.to}`);
    } catch(e){ 
      console.error("❌ Email error:", e); 
    }
  }
}
