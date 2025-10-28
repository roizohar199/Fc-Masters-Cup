// server/src/utils/sendEmailSafe.ts
import nodemailer from "nodemailer";

type Args = { to: string; subject: string; html: string };

export async function sendEmailSafe({ to, subject, html }: Args) {
  try {
    // אם אין SMTP – לא נשלח, רק לוג
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log(`[email mock] → ${to}: ${subject}`);
      return;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true, // ✅ חשוב! עבור Hostinger משתמשים ב-SSL על פורט 465
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.warn("[email skipped]", (e as Error).message);
  }
}
