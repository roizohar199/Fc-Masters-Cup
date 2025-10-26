// server/src/utils/notify.ts
import Database from "better-sqlite3";
import { sendEmailSafe } from "./sendEmailSafe.js";

export type NotifyArgs = {
  db: Database.Database;
  userId?: number | null;
  email?: string | null;
  title: string;
  body: string;
  type?: string;
  payload?: any;
};

export function insertNotification(
  db: Database.Database,
  args: Omit<NotifyArgs, "db" | "title" | "body"> & { title: string; body: string }
) {
  const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as { name: string }[];
  const hasUserId = cols.some((c) => c.name === "user_id");
  const payload = args.payload ? JSON.stringify(args.payload) : null;

  if (hasUserId) {
    db.prepare(
      `INSERT INTO notifications(user_id,email,type,title,body,payload,created_at)
       VALUES (?,?,?,?,?,?,datetime('now'))`
    ).run(args.userId ?? null, args.email ?? null, args.type ?? "tournament_update", args.title, args.body, payload);
  } else {
    db.prepare(
      `INSERT INTO notifications(email,type,title,body,payload,created_at)
       VALUES (?,?,?,?,?,datetime('now'))`
    ).run(args.email ?? null, args.type ?? "tournament_update", args.title, args.body, payload);
  }
}

export function notifyUser({ db, userId, email, title, body, type, payload }: NotifyArgs) {
  try {
    insertNotification(db, { userId, email, title, body, type, payload });
  } catch (e) {
    console.warn("[notify] skipped", (e as Error).message);
  }
  if (email) {
    void sendEmailSafe({ to: email, subject: title, html: `<p>${body}</p>` });
  }
}

/** חדש: שליפת התראות למשתמש (לשימוש ב־/me/notifications וכד׳) */
export function listUserNotifications(
  db: Database.Database,
  userId: number,
  limit = 50
): Array<{ id: number; title: string; body: string; created_at: string; read_at: string | null; type?: string }> {
  return db
    .prepare(
      `SELECT id, title, body, created_at, read_at, type
       FROM notifications
       WHERE user_id = ?
       ORDER BY COALESCE(read_at, created_at) DESC
       LIMIT ?`
    )
    .all(userId, limit) as any[];
}

/** חדש: סימון התראה כנקראה */
export function markNotificationRead(db: Database.Database, id: number, userId: number) {
  db.prepare(
    `UPDATE notifications SET read_at = datetime('now')
     WHERE id = ? AND (user_id = ? OR user_id IS NULL)`
  ).run(id, userId);
}