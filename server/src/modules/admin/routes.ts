import { Router } from "express";
import { sendMail } from "../mail/mailer.js";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../tournaments.sqlite");
const db = new Database(DB_PATH);

export const adminRouter = Router();

adminRouter.post("/users/:id/email", async (req: any, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ error: "forbidden" });
  }
  
  const u = db.prepare("SELECT email, psnUsername FROM users WHERE id=?").get(Number(req.params.id));
  if (!u) return res.status(404).json({ error: "user not found" });

  const { subject, html } = req.body;
  if (!subject || !html) return res.status(400).json({ error: "subject & html required" });

  try {
    const id = await sendMail(u.email, subject, html);
    res.json({ ok: true, messageId: id });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});
