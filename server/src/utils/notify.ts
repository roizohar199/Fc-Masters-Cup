// server/src/utils/notify.ts
import Database from "better-sqlite3";

let db: Database.Database | null = null;
function getDb(): Database.Database {
  if (!db) {
    db = new Database(process.env.DB_PATH || "./server/tournaments.sqlite");
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  return db!;
}

export function createNotification(opts: { userId: number; title: string; body?: string; link?: string }) {
  const db = getDb();
  db.prepare(`INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)`)
    .run(opts.userId, opts.title, opts.body || "", opts.link || null);
}

export function listUserNotifications(userId: number) {
  const db = getDb();
  return db.prepare(`SELECT id,title,body,link,is_read,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50`)
    .all(userId);
}

export function markNotificationRead(userId: number, id: number) {
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?`).run(id, userId);
}
