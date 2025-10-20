import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { uuid } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";
import { requireAuth, requireSuperAdmin } from "../auth.js";
import { sendTournamentRegistrationEmail } from "../email.js";

export const tournamentRegistrations = Router();

// Helper function to check if user is admin or super admin
function isAdminOrSuperAdmin(email: string): boolean {
  const user = db.prepare(`SELECT role, isSuperAdmin FROM users WHERE email=?`).get(email) as any;
  return user && (user.role === 'admin' || user.isSuperAdmin === 1);
}

/** GET /api/tournament-registrations/:id/summary
 * מחזיר מצב הרשמה: כמה נרשמו, האם מלא, ומצב המשתמש
 */
tournamentRegistrations.get("/:id/summary", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  
  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as any;
  if (!t) return res.status(404).json({ ok: false, error: "tournament_not_found" });

  const countRow = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as any;
  const count = Number(countRow?.n || 0);

  const userId = (req as any).user.uid;
  const myReg = db.prepare(
    `SELECT state FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as any;

  const capacity = t.registrationCapacity || 100;
  const minPlayers = t.registrationMinPlayers || 16;

  return res.json({
    ok: true,
    tournament: {
      id: t.id,
      title: t.title,
      status: t.registrationStatus || "closed",
      capacity,
      min: minPlayers,
    },
    count,
    isFull: count >= capacity,
    myState: myReg?.state || null,
  });
});

/** POST /api/tournament-registrations/:id/register
 * רישום משתמש אחד (idempotent). שולח מייל לרועי על כל רישום חדש.
 */
tournamentRegistrations.post("/:id/register", requireAuth, async (req, res) => {
  const tournamentId = req.params.id;
  
  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as any;
  if (!t || t.registrationStatus !== "collecting") {
    return res.status(400).json({ ok: false, error: "not_collecting" });
  }

  const capacity = t.registrationCapacity || 100;
  const countRow = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as any;
  const countBefore = Number(countRow?.n || 0);

  if (countBefore >= capacity) {
    return res.status(409).json({ ok: false, error: "full" });
  }

  const userId = (req as any).user.uid;
  const userEmail = (req as any).user.email;
  
  // קבל את שם המשתמש מ-DB
  const user = db.prepare(`SELECT email, psnUsername FROM users WHERE id=?`).get(userId) as any;
  const userName = user?.psnUsername || userEmail;

  const existing = db.prepare(
    `SELECT * FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as any;

  let created = false;

  if (!existing) {
    db.prepare(
      `INSERT INTO tournament_registrations (id, tournamentId, userId, state, createdAt, updatedAt) VALUES (?, ?, ?, 'registered', ?, ?)`
    ).run(uuid(), tournamentId, userId, nowISO(), nowISO());
    created = true;
  } else if (existing.state !== "registered") {
    db.prepare(
      `UPDATE tournament_registrations SET state='registered', updatedAt=? WHERE id=?`
    ).run(nowISO(), existing.id);
    created = true;
  }

  const afterRow = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as any;
  const count = Number(afterRow?.n || 0);

  // שלח מייל על רישום חדש (רק אם באמת חדש/הופעל שוב)
  if (created) {
    sendTournamentRegistrationEmail({
      tournamentTitle: t.title,
      userName,
      userEmail,
      count,
      capacity,
    }).catch((e) => console.warn("[MAIL] failed:", e?.message || e));
  }

  return res.json({ ok: true, count, capacity });
});

/** POST /api/tournament-registrations/:id/unregister
 * ביטול רישום למשתמש הנוכחי
 */
tournamentRegistrations.post("/:id/unregister", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  
  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as any;
  if (!t || t.registrationStatus !== "collecting") {
    return res.status(400).json({ ok: false, error: "not_collecting" });
  }

  const userId = (req as any).user.uid;
  const existing = db.prepare(
    `SELECT * FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as any;

  if (!existing) {
    return res.json({ ok: true, state: "not_registered" });
  }

  db.prepare(
    `UPDATE tournament_registrations SET state='cancelled', updatedAt=? WHERE id=?`
  ).run(nowISO(), existing.id);

  const afterRow = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as any;

  return res.json({ ok: true, count: Number(afterRow?.n || 0) });
});

/** GET /api/tournament-registrations/:id/registrations  (admin/superadmin)
 * רשימת נרשמים, חיפוש, פייג'ינג
 */
tournamentRegistrations.get("/:id/registrations", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  const userEmail = (req as any).user.email;

  // בדיקת הרשאות
  if (!isAdminOrSuperAdmin(userEmail)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as any;
  if (!t) return res.status(404).json({ ok: false, error: "not_found" });

  const state = (req.query.state as string) || "registered";
  const search = (req.query.search as string) || "";
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "50", 10), 1), 200);
  const cursor = (req.query.cursor as string) || undefined;

  // חיפוש בסיסי לפי name/email; paginate עם afterId (lazy)
  let sql = `
    SELECT tr.*, u.psnUsername as name, u.email
    FROM tournament_registrations tr
    JOIN users u ON u.id = tr.userId
    WHERE tr.tournamentId = ? AND tr.state = ?
  `;
  const params: any[] = [tournamentId, state];

  if (search) {
    sql += ` AND (u.psnUsername LIKE ? OR u.email LIKE ?) `;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (cursor) {
    sql += ` AND tr.rowid > (SELECT rowid FROM tournament_registrations WHERE id = ?) `;
    params.push(cursor);
  }

  sql += ` ORDER BY tr.createdAt ASC LIMIT ? `;
  params.push(limit);

  const items = db.prepare(sql).all(...params);

  const totalRow = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state=?`
  ).get(tournamentId, state) as any;
  const total = Number(totalRow?.n || 0);

  const nextCursor = items.length === limit ? (items[items.length - 1] as any).id : null;

  res.json({ ok: true, items, total, nextCursor });
});

/** GET /api/tournament-registrations/:id/registrations/export  (admin/superadmin)
 * יצוא CSV של נרשמים
 */
tournamentRegistrations.get("/:id/registrations/export", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  const userEmail = (req as any).user.email;

  // בדיקת הרשאות
  if (!isAdminOrSuperAdmin(userEmail)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const sql = `
    SELECT tr.userId, u.psnUsername as name, u.email, tr.createdAt as registeredAt
    FROM tournament_registrations tr
    JOIN users u ON u.id = tr.userId
    WHERE tr.tournamentId = ? AND tr.state = 'registered'
    ORDER BY tr.createdAt ASC
    LIMIT 10000
  `;
  const items = db.prepare(sql).all(tournamentId) as any[];

  const header = "userId,name,email,registeredAt\n";
  const body = items
    .map(
      (r: any) =>
        `${r.userId},"${String(r.name || "").replace(/"/g, '""')}",${r.email || ""},${r.registeredAt}`
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="registrations.csv"');
  res.send(header + body);
});

/** Admin: פתיחה/סגירה/קיבולת */
tournamentRegistrations.post("/:id/admin/open", requireAuth, (req, res) => {
  const userEmail = (req as any).user.email;

  // בדיקת הרשאות
  if (!isAdminOrSuperAdmin(userEmail)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const schema = z.object({
    title: z.string().min(1).optional(),
    capacity: z.number().int().min(2).max(100).optional(),
    min: z.number().int().min(2).max(100).optional(),
  });

  const body = schema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ ok: false, error: "bad_request", issues: body.error.issues });
  }

  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id) as any;
  if (!t) return res.status(404).json({ ok: false, error: "not_found" });

  // עדכן את השדות
  let sql = `UPDATE tournaments SET registrationStatus='collecting'`;
  const params: any[] = [];

  if (body.data.title !== undefined) {
    sql += `, title=?`;
    params.push(body.data.title);
  }
  if (body.data.capacity !== undefined) {
    sql += `, registrationCapacity=?`;
    params.push(body.data.capacity);
  }
  if (body.data.min !== undefined) {
    sql += `, registrationMinPlayers=?`;
    params.push(body.data.min);
  }

  sql += ` WHERE id=?`;
  params.push(t.id);

  db.prepare(sql).run(...params);

  const updated = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(t.id);
  res.json({ ok: true, tournament: updated });
});

tournamentRegistrations.post("/:id/admin/close", requireAuth, (req, res) => {
  const userEmail = (req as any).user.email;

  // בדיקת הרשאות
  if (!isAdminOrSuperAdmin(userEmail)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const t = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id) as any;
  if (!t) return res.status(404).json({ ok: false, error: "not_found" });

  db.prepare(`UPDATE tournaments SET registrationStatus='closed' WHERE id=?`).run(t.id);

  const updated = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(t.id);
  res.json({ ok: true, tournament: updated });
});

