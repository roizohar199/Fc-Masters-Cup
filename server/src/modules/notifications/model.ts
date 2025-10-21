import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../tournaments.sqlite");
const db = new Database(DB_PATH);

export type Notification = {
  id: number; 
  user_id: number; 
  title: string; 
  body: string; 
  kind: string;
  is_read: 0|1; 
  created_at: string;
};

export function createNotification(userId: number, title: string, body: string, kind: string = "info") {
  const stmt = db.prepare(
    "INSERT INTO notifications (user_id, title, body, kind) VALUES (?, ?, ?, ?)"
  );
  const res = stmt.run(userId, title, body, kind);
  return res.lastInsertRowid as number;
}

export function listUnreadForUser(userId: number): Notification[] {
  return db.prepare(
    "SELECT * FROM notifications WHERE user_id=? AND is_read=0 ORDER BY id DESC LIMIT 20"
  ).all(userId) as Notification[];
}

export function markRead(userId: number, id: number) {
  return db.prepare(
    "UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?"
  ).run(id, userId);
}

export function markAllRead(userId: number) {
  return db.prepare(
    "UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0"
  ).run(userId);
}
