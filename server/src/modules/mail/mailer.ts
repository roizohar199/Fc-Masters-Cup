import nodemailer from "nodemailer";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "./server/tournaments.sqlite";
const db = new Database(DB_PATH);

// ---- helpers ----
function getBool(v: any, def=false) {
  if (v === undefined || v === null) return def;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// ---- transporter ----
const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 587);
const secure = getBool(process.env.SMTP_SECURE, port === 465);

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,                 // 587=false (STARTTLS) / 465=true
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  // pool עוזר ביציבות עם Gmail
  pool: true,
  maxConnections: 1,
  maxMessages: 50,
  // logger/debug – הפעל זמנית אם צריך:
  // logger: true,
  // debug: true,
});

// ---- startup verify ----
export async function verifySmtp() {
  const summary = {
    host, port, secure,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    user: process.env.SMTP_USER,
  };
  try {
    await transporter.verify();
    console.log("✅ SMTP verify OK", summary);
    return { ok: true, ...summary };
  } catch (e:any) {
    console.error("❌ SMTP verify FAILED", summary, String(e?.message || e));
    return { ok: false, error: String(e?.message || e), ...summary };
  }
}

// ---- DB logs ----
function logEmail(to: string, subject: string, status: "SENT"|"ERROR", extra: {error?: string, messageId?: string} = {}) {
  try {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        message_id TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();

    db.prepare(
      `INSERT INTO email_logs (to_email, subject, status, error, message_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(to, subject, status, extra.error ?? null, extra.messageId ?? null);
  } catch (e) {
    console.error("email_logs insert failed:", e);
  }
}

export async function sendMailSafe(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    logEmail(to, subject, "SENT", { messageId: info.messageId });
    return { ok: true, messageId: info.messageId };
  } catch (e:any) {
    logEmail(to, subject, "ERROR", { error: String(e?.message || e) });
    throw e;
  }
}

export async function sendToAdmins(subject: string, html: string) {
  const admins = parseAdminEmails();
  if (!admins.length) {
    console.warn("⚠️ ADMIN_EMAILS is empty – no admin mails will be sent");
    return;
  }
  console.log(`📧 Sending to ${admins.length} admin(s): ${subject}`);
  await Promise.allSettled(admins.map(to => sendMailSafe(to, subject, html)));
}

/** שליחת מייל בסיסית (מיושן - השתמש ב-sendMailSafe) */
export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER!;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info.messageId;
}

// ---- templates ----
export function tplNewUserRegistered(opts: { email: string; displayName?: string | null; psn?: string | null; manageUrl?: string; }) {
  const { email, displayName, psn, manageUrl } = opts;
  return `<div dir="rtl" style="font-family:Arial"><h3>🆕 משתמש חדש נרשם</h3>
  <ul><li><b>אימייל:</b> ${email}</li><li><b>שם:</b> ${displayName ?? "-"}</li><li><b>PSN:</b> ${psn ?? "-"}</li></ul>
  ${manageUrl ? `<p><a href="${manageUrl}" target="_blank" rel="noopener">ניהול משתמשים</a></p>` : ""}</div>`;
}

export function tplUserJoinedTournament(opts: { userEmail: string; userName?: string | null; tournamentId: number | string; tournamentName?: string | null; startsAt?: string | null; manageUrl?: string; }) {
  const { userEmail, userName, tournamentId, tournamentName, startsAt, manageUrl } = opts;
  return `<div dir="rtl" style="font-family:Arial"><h3>🎟️ משתמש נרשם לטורניר</h3>
  <ul><li><b>אימייל:</b> ${userEmail}</li><li><b>שם:</b> ${userName ?? "-"}</li>
  <li><b>טורניר:</b> ${tournamentName ?? "#"+tournamentId}</li><li><b>פתיחה:</b> ${startsAt ?? "-"}</li></ul>
  ${manageUrl ? `<p><a href="${manageUrl}" target="_blank" rel="noopener">ניהול טורניר</a></p>` : ""}</div>`;
}

/** תבנית מייל לבחירת שחקן לטורניר (backward compatibility) */
export function tournamentSelectionTemplate(opts: {
  userName?: string;
  tournamentName: string;
  startsAt?: string;
  ctaUrl: string;
}) {
  const { userName = "שחקן/ית יקר/ה", tournamentName, startsAt, ctaUrl } = opts;
  return `
  <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif">
    <h2>🎉 נבחרת להשתתף בטורניר: ${tournamentName}</h2>
    <p>שלום ${userName},</p>
    <p>שמחים להודיע שנבחרת להשתתף בטורניר שעומד להתחיל${startsAt ? ` ב־<b>${startsAt}</b>` : ""}.</p>
    <p>לאישור והצגת פרטים:</p>
    <p><a href="${ctaUrl}" target="_blank" rel="noopener">לצפייה בטורניר</a></p>
    <hr/>
    <small>FC Masters Cup</small>
  </div>`;
}
