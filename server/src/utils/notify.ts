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

export function insertNotification(db: Database.Database, args: Omit<NotifyArgs,"db"|"title"|"body"> & { title: string; body: string; }) {
  const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as {name:string}[];
  const hasUserId = cols.some(c => c.name === "user_id");
  const payload = args.payload ? JSON.stringify(args.payload) : null;

  if (hasUserId) {
    db.prepare(`
      INSERT INTO notifications(user_id,email,type,title,body,payload,created_at)
      VALUES (?,?,?,?,?,?,datetime('now'))
    `).run(args.userId ?? null, args.email ?? null, args.type ?? 'tournament_update', args.title, args.body, payload);
  } else {
    db.prepare(`
      INSERT INTO notifications(email,type,title,body,payload,created_at)
      VALUES (?,?,?,?,?,datetime('now'))
    `).run(args.email ?? null, args.type ?? 'tournament_update', args.title, args.body, payload);
  }
}

export function notifyUser({ db, userId, email, title, body, type, payload }: NotifyArgs) {
  try { insertNotification(db, { userId, email, title, body, type, payload }); } catch (e) { console.warn('[notify] skipped', (e as Error).message); }
  sendEmailSafe({ to: email || '', subject: title, html: `<p>${body}</p><br><a href="${process.env.SITE_URL || '#'}">כניסה לאתר</a>` });
}