import nodemailer from "nodemailer";
import { createDbConnection } from "../../db.js";

const db = createDbConnection();

function getBool(v: any, def=false) {
  if (v === undefined || v === null) return def;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

const BASE_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const ENV_PORT = Number(process.env.SMTP_PORT || 587);
const ENV_SECURE = getBool(process.env.SMTP_SECURE, ENV_PORT === 465);

function createTx({ host, port, secure }: { host: string; port: number; secure: boolean; }) {
  // ✅ תיקון מלא ל־SMTP ב־Hostinger
  console.log("📧 SMTP CONFIG →", {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    from: process.env.EMAIL_FROM
  });

  return nodemailer.createTransport({
    host,
    port,
    secure,                // 587=false (STARTTLS), 465=true (SSL)
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
      rejectUnauthorized: false, // מונע שגיאות SSL אפשריות
    },
  });
}

// טרנספורטר ע"פ ה־ENV
let transporter = createTx({ host: BASE_HOST, port: ENV_PORT, secure: ENV_SECURE });

export async function verifySmtp() {
  const primary = { host: BASE_HOST, port: ENV_PORT, secure: ENV_SECURE, user: process.env.SMTP_USER };
  try {
    await transporter.verify();
    console.log("✅ SMTP connection success - ready to send emails!");
    return { ok: true, mode: "primary", ...primary };
  } catch (e:any) {
    console.error("❌ SMTP connection failed:", e.message);
    // נסה Fallback ל-465 אם נכשל (רק כשלא ניסינו כבר 465)
    if (ENV_PORT !== 465) {
      const alt = { host: BASE_HOST, port: 465, secure: true, user: process.env.SMTP_USER };
      const fallback = createTx(alt);
      try {
        await fallback.verify();
        transporter = fallback; // עבור להשתמש בעתיד
        console.log("✅ SMTP fallback connection success (port 465)!");
        return { ok: true, mode: "fallback465", ...alt };
      } catch (e2:any) {
        console.error("❌ SMTP fallback also failed:", e2.message);
        return { ok: false, error_primary: String(e?.message || e), error_fallback: String(e2?.message || e2), ...primary };
      }
    }
    return { ok: false, error_primary: String(e?.message || e), ...primary };
  }
}

// לוגים ל-DB
function ensureLogsTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    message_id TEXT,
    smtp_response TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
ensureLogsTable();

function logEmail(to: string, subject: string, status: "SENT"|"ERROR", extra: {error?: string, messageId?: string, response?: string} = {}) {
  try {
    db.prepare(
      `INSERT INTO email_logs (to_email, subject, status, error, message_id, smtp_response)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(to, subject, status, extra.error ?? null, extra.messageId ?? null, extra.response ?? null);
  } catch (e) {
    console.error("email_logs insert failed:", e);
  }
}

export async function sendMailSafe(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    const response = (info as any)?.response || "";
    logEmail(to, subject, "SENT", { messageId: info.messageId, response });
    return { ok: true, messageId: info.messageId, response };
  } catch (e:any) {
    logEmail(to, subject, "ERROR", { error: String(e?.message || e) });
    throw e;
  }
}

export function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
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
