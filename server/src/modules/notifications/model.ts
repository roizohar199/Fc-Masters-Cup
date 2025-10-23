import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../../tournaments.sqlite");
const db = new Database(DB_PATH);

export type Notification = {
  id: string; 
  userId: string; 
  type: string; 
  title: string; 
  message: string; 
  data?: string;
  isRead: 0|1; 
  createdAt: string;
};

export function createNotification(userId: string, title: string, message: string, type: string = "info", data?: string) {
  const stmt = db.prepare(
    "INSERT INTO notifications (id, userId, type, title, message, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const id = randomUUID();
  const now = new Date().toISOString();
  const res = stmt.run(id, userId, type, title, message, data || null, now);
  return id;
}

export function listUnreadForUser(userId: string): Notification[] {
  return db.prepare(
    "SELECT * FROM notifications WHERE userId=? AND isRead=0 ORDER BY createdAt DESC LIMIT 20"
  ).all(userId) as Notification[];
}

export function markRead(userId: string, id: string) {
  return db.prepare(
    "UPDATE notifications SET isRead=1 WHERE id=? AND userId=?"
  ).run(id, userId);
}

export function markAllRead(userId: string) {
  return db.prepare(
    "UPDATE notifications SET isRead=1 WHERE userId=? AND isRead=0"
  ).run(userId);
}

export function deleteNotificationsByTournamentId(tournamentId: string) {
  return db.prepare(
    "DELETE FROM notifications WHERE data LIKE ?"
  ).run(`%"tournamentId":"${tournamentId}"%`);
}

export function deleteNotification(notificationId: string, userId: string) {
  return db.prepare(
    "DELETE FROM notifications WHERE id=? AND userId=?"
  ).run(notificationId, userId);
}