import nodemailer from "nodemailer";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "./server/tournaments.sqlite";
const db = new Database(DB_PATH);

function getBool(v: any, def=false) {
  if (v === undefined || v === null) return def;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 587);
const secure = getBool(process.env.SMTP_SECURE, port === 465);

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,          // 587 → false (STARTTLS), 465 → true (SSL)
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  tls: {
    // במידה וספק מארח עושה בעיות בתעודה; השאר כמותאם ברירת מחדל אם לא צריך:
    // rejectUnauthorized: false
  },
  // הדלקת דיבאג אם צריך:
  // logger: true,
  // debug: true,
});

export async function verifySmtp() {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (e:any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function logEmail(to: string, subject: string, status: "SENT"|"ERROR", extra: {error?: string, messageId?: string} = {}) {
  try {
    db.prepare(
      `INSERT INTO email_logs (to_email, subject, status, error, message_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(to, subject, status, extra.error ?? null, extra.messageId ?? null);
  } catch (e) {
    console.error("Failed to log email:", e);
  }
}

export async function sendMailSafe(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    logEmail(to, subject, "SENT", { messageId: info.messageId });
    return { ok: true, messageId: info.messageId };
  } catch (e:any) {
    logEmail(to, subject, "ERROR", { error: String(e?.message || e) });
    throw e;
  }
}

/** שליחת מייל בסיסית (מיושן - השתמש ב-sendMailSafe) */
export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info.messageId;
}

/** תבנית מייל לבחירת שחקן לטורניר */
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
