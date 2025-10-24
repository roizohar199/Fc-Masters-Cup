// server/src/utils/sendEmail.ts
import nodemailer, { Transporter } from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false") === "true";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const from =
  process.env.EMAIL_FROM ||
  (smtpUser ? `FC Masters Cup <${smtpUser}>` : "FC Masters Cup <no-reply@k-rstudio.com>");

// חשוב: createTransport (לא createTransporter)
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
