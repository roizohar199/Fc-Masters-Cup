import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

/** שליחת מייל בסיסית */
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
