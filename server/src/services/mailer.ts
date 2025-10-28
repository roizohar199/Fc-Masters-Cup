// server/src/services/mailer.ts
import nodemailer, { SendMailOptions } from "nodemailer";

const port = Number(process.env.SMTP_PORT || 587);
const secure = process.env.SMTP_SECURE === "true" || port === 465;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,                 // Hostinger: 587 => secure:false (STARTTLS), 465 => secure:true
  auth: {
    user: process.env.SMTP_USER!, // למשל: fcmasterscup@fcmasterscup.com
    pass: process.env.SMTP_PASS!, // Roizohar1985!
  },
  requireTLS: !secure,     // ב-587 נכריח STARTTLS
  tls: { minVersion: "TLSv1.2" },
  pool: true,              // חיבור מאוחד יציב יותר
  maxConnections: 5,
  maxMessages: 50,
  logger: true,            // לוג מפורט
  debug: true,
});

export async function verifySmtp(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("[email] ✅ SMTP verify OK");
    return true;
  } catch (err) {
    console.error("[email] ❌ SMTP verify FAILED:", err);
    return false;
  }
}

export async function sendMail(opts: SendMailOptions) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER, // חייב להיות מאותו דומיין!
    ...opts,
  });

  console.log("[email] result:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    envelope: info.envelope,
    response: info.response,
  });

  if (info.rejected && info.rejected.length) {
    throw new Error("SMTP rejected: " + info.rejected.join(","));
  }
  return info;
}
