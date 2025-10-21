import { Router } from "express";
import Database from "better-sqlite3";
import { sendMailSafe } from "../mail/mailer.js";

export const adminRouter = Router();

type DbUser = {
  id: number;
  email: string;
  display_name?: string | null;
  psnUsername?: string | null;
};

function getDb() {
  const DB_PATH = process.env.DB_PATH || "./server/tournaments.sqlite";
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");
  return db;
}

/**
 * שליחת מייל ידני למשתמש רשום (Admin/Manager בלבד)
 * POST /api/admin/users/:id/email
 * body: { subject: string, html: string }
 */
adminRouter.post("/users/:id/email", async (req: any, res) => {
  try {
    if (!req.user || !(req.user.is_admin || req.user.is_manager)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "invalid user id" });
    }

    const { subject, html } = req.body || {};
    if (!subject || !html) {
      return res.status(400).json({ error: "subject & html required" });
    }

    const db = getDb();
    const row = db
      .prepare("SELECT id, email, display_name, psnUsername FROM users WHERE id=?")
      .get(userId) as DbUser | undefined;

    if (!row) return res.status(404).json({ error: "user not found" });

    const result = await sendMailSafe(
      row.email,
      subject,
      html
    );

    return res.json(result);
  } catch (err: any) {
    console.error("admin email error:", err);
    return res.status(500).json({ error: "internal_error", details: String(err?.message || err) });
  }
});
