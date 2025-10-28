// server/src/utils/sendEmail.ts
import nodemailer, { Transporter } from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = true; // ✅ חשוב! עבור Hostinger משתמשים ב-SSL על פורט 465
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const from =
  process.env.EMAIL_FROM ||
  (smtpUser ? `FC Masters Cup <${smtpUser}>` : "FC Masters Cup <no-reply@fcmasterscup.com>");

// ✅ תיקון מלא ל־SMTP ב־Hostinger
const transporter: Transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!opts.to) throw new Error("Missing recipient email");
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
