import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { uuid } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";
import { requireAuth, requireSuperAdmin } from "../auth.js";
import { sendTournamentRegistrationEmail, sendTournamentSelectionEmail } from "../email.js";

export const tournamentRegistrations = Router();

// Types for better TypeScript support
interface User {
  id: string;
  email: string;
  psnUsername?: string;
  role?: string;
  isSuperAdmin?: number;
}

interface Tournament {
  id: string;
  title: string;
  registrationStatus?: string;
  registrationCapacity?: number;
  registrationMinPlayers?: number;
  status?: string;
  updatedAt?: string;
}

interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string | null;
  isRead: number;
  createdAt: string;
}

// Helper function to check if user is admin or super admin
function isAdminOrSuperAdmin(email: string): boolean {
  const user: User | undefined = db.prepare(`SELECT role, isSuperAdmin FROM users WHERE email=?`).get(email) as User | undefined;
  return !!(user && (user.role === 'admin' || user.isSuperAdmin === 1));
}

/** GET /api/tournament-registrations/:id/summary
 * מחזיר מצב הרשמה: כמה נרשמו, האם מלא, ומצב המשתמש
 */
tournamentRegistrations.get("/:id/summary", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  
  let t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as Tournament | undefined;
  
  // אם לא נמצא טורניר ספציפי, נחפש טורניר פעיל אחר
  if (!t && tournamentId === "default") {
    // נחפש טורניר עם הרשמה פתוחה
    t = db.prepare(`
      SELECT * FROM tournaments 
      WHERE registrationStatus IN ('open', 'collecting') 
      ORDER BY createdAt DESC 
      LIMIT 1
    `).get() as Tournament | undefined;
    
    // אם לא נמצא, ניצור טורניר ברירת מחדל
    if (!t) {
      console.log("🔧 No active tournament found, creating default tournament");
      const defaultTournament = {
        id: "default-tournament",
        title: "טורניר שישי בערב",
        registrationStatus: "collecting",
        registrationCapacity: 100,
        registrationMinPlayers: 16,
        createdAt: new Date().toISOString()
      };
      
      // נכניס את הטורניר למסד הנתונים
      db.prepare(`
        INSERT OR REPLACE INTO tournaments 
        (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond, registrationStatus, registrationCapacity, registrationMinPlayers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        defaultTournament.id,
        defaultTournament.title,
        "FIFA 24",
        "PS5",
        "Asia/Jerusalem",
        defaultTournament.createdAt,
        500,
        0,
        defaultTournament.registrationStatus,
        defaultTournament.registrationCapacity,
        defaultTournament.registrationMinPlayers
      );
      
      t = defaultTournament as Tournament;
    }
  }
  
  if (!t) return res.status(404).json({ ok: false, error: "tournament_not_found" });

  const countRow: { n: number } | undefined = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as { n: number } | undefined;
  const count = Number(countRow?.n || 0);

  const userId = (req as any).user.uid;
  const myReg: { state: string } | undefined = db.prepare(
    `SELECT state FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as { state: string } | undefined;

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
  
  const t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as Tournament | undefined;
  if (!t || t.registrationStatus !== "collecting") {
    return res.status(400).json({ ok: false, error: "not_collecting" });
  }

  const capacity = t.registrationCapacity || 100;
  const countRow: { n: number } | undefined = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as { n: number } | undefined;
  const countBefore = Number(countRow?.n || 0);

  if (countBefore >= capacity) {
    return res.status(409).json({ ok: false, error: "full" });
  }

  const userId = (req as any).user.uid;
  const userEmail = (req as any).user.email;
  
  // קבל את שם המשתמש מ-DB
  const user: User | undefined = db.prepare(`SELECT email, psnUsername FROM users WHERE id=?`).get(userId) as User | undefined;
  const userName = user?.psnUsername || userEmail;

  const existing: Registration | undefined = db.prepare(
    `SELECT * FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as Registration | undefined;

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

  const afterRow: { n: number } | undefined = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as { n: number } | undefined;
  const count = Number(afterRow?.n || 0);

  // שלח מייל על רישום חדש (רק אם באמת חדש/הופעל שוב)
  if (created) {
    sendTournamentRegistrationEmail({
      tournamentTitle: t.title,
      userName,
      userEmail,
      count,
      capacity,
    }).catch((e: any) => console.warn("[MAIL] failed:", e?.message || e));
  }

  return res.json({ ok: true, count, capacity });
});

/** POST /api/tournament-registrations/:id/unregister
 * ביטול רישום למשתמש הנוכחי
 */
tournamentRegistrations.post("/:id/unregister", requireAuth, (req, res) => {
  const tournamentId = req.params.id;
  
  const t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as Tournament | undefined;
  if (!t || t.registrationStatus !== "collecting") {
    return res.status(400).json({ ok: false, error: "not_collecting" });
  }

  const userId = (req as any).user.uid;
  const existing: Registration | undefined = db.prepare(
    `SELECT * FROM tournament_registrations WHERE tournamentId=? AND userId=?`
  ).get(tournamentId, userId) as Registration | undefined;

  if (!existing) {
    return res.json({ ok: true, state: "not_registered" });
  }

  db.prepare(
    `UPDATE tournament_registrations SET state='cancelled', updatedAt=? WHERE id=?`
  ).run(nowISO(), existing.id);

  const afterRow: { n: number } | undefined = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state='registered'`
  ).get(tournamentId) as { n: number } | undefined;

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

  const t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(tournamentId) as Tournament | undefined;
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

  const totalRow: { n: number } | undefined = db.prepare(
    `SELECT COUNT(*) AS n FROM tournament_registrations WHERE tournamentId=? AND state=?`
  ).get(tournamentId, state) as { n: number } | undefined;
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

  const t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id) as Tournament | undefined;
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

  const t: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(req.params.id) as Tournament | undefined;
  if (!t) return res.status(404).json({ ok: false, error: "not_found" });

  db.prepare(`UPDATE tournaments SET registrationStatus='closed' WHERE id=?`).run(t.id);

  const updated = db.prepare(`SELECT * FROM tournaments WHERE id=?`).get(t.id);
  res.json({ ok: true, tournament: updated });
});

/** POST /api/tournament-registrations/:id/select-players
 * בחירת שחקנים להשתתפות בטורניר (admin/superadmin)
 */
tournamentRegistrations.post("/:id/select-players", requireAuth, async (req, res) => {
  const tournamentId = req.params.id;
  const userEmail = (req as any).user?.email;
  
  if (!userEmail || !isAdminOrSuperAdmin(userEmail)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const schema = z.object({
    selectedUserIds: z.array(z.string()).min(1).max(16),
    tournamentTitle: z.string().min(1),
    tournamentDate: z.string().optional(),
    telegramLink: z.string().url().optional(),
    prizeFirst: z.number().min(0).default(500),
    prizeSecond: z.number().min(0).default(0)
  });

  const body = schema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ 
      ok: false, 
      error: "bad_request", 
      issues: body.error.issues 
    });
  }

  const { selectedUserIds, tournamentTitle, tournamentDate, telegramLink, prizeFirst, prizeSecond } = body.data;

  try {
    // בדיקה שהטורניר קיים
    const tournament: Tournament | undefined = db.prepare(`SELECT * FROM tournaments WHERE id = ?`).get(tournamentId) as Tournament | undefined;
    if (!tournament) {
      return res.status(404).json({ ok: false, error: "tournament_not_found" });
    }

    // בדיקה שהמשתמשים קיימים
    const placeholders = selectedUserIds.map(() => '?').join(',');
    const users = db.prepare(`SELECT id, email, psnUsername FROM users WHERE id IN (${placeholders})`).all(selectedUserIds) as User[];
    
    if (users.length !== selectedUserIds.length) {
      return res.status(400).json({ ok: false, error: "some_users_not_found" });
    }

    // יצירת הודעות למשתמשים שנבחרו
    const notificationPromises = users.map((user: User) => {
      const notificationId = uuid();
      const notificationData = {
        tournamentId,
        tournamentTitle,
        tournamentDate,
        telegramLink,
        prizeFirst,
        prizeSecond
      };

      // הוספת הודעה למסד הנתונים
      db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, data, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        notificationId,
        user.id,
        'tournament_selection',
        `נבחרת להשתתף בטורניר: ${tournamentTitle}`,
        `מזל טוב! נבחרת להשתתף בטורניר "${tournamentTitle}". הטורניר יתחיל בקרוב - הישאר ערני לעדכונים!`,
        JSON.stringify(notificationData),
        nowISO()
      );

      // שליחת מייל
      return sendTournamentSelectionEmail({
        userEmail: user.email,
        userName: user.psnUsername || user.email,
        tournamentTitle,
        tournamentDate,
        telegramLink,
        prizeFirst,
        prizeSecond
      });
    });

    // ביצוע כל הפעולות
    await Promise.all(notificationPromises);

    // עדכון סטטוס הטורניר ל"running"
    db.prepare(`UPDATE tournaments SET status = 'running', updatedAt = ? WHERE id = ?`).run(nowISO(), tournamentId);

    console.log(`[Tournament Selection] Selected ${users.length} players for tournament ${tournamentId}`);

    res.json({ 
      ok: true, 
      message: `נבחרו ${users.length} שחקנים לטורניר`,
      selectedCount: users.length,
      selectedUsers: users.map((u: User) => ({ id: u.id, email: u.email, psnUsername: u.psnUsername }))
    });

  } catch (error: any) {
    console.error('[Tournament Selection] Error:', error);
    res.status(500).json({ ok: false, error: "internal_server_error" });
  }
});

/** GET /api/tournament-registrations/notifications
 * קבלת הודעות למשתמש הנוכחי
 */
tournamentRegistrations.get("/notifications", requireAuth, (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const notifications = db.prepare(`
    SELECT id, type, title, message, data, isRead, createdAt
    FROM notifications 
    WHERE userId = ? 
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const unreadCount: { count: number } | undefined = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`).get(userId) as { count: number } | undefined;

  res.json({ 
    ok: true, 
    notifications: (notifications as any[]).map((n: any) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null
    })),
    unreadCount: unreadCount?.count || 0
  });
});

/** PUT /api/tournament-registrations/notifications/:id/read
 * סימון הודעה כנקראה
 */
tournamentRegistrations.put("/notifications/:id/read", requireAuth, (req, res) => {
  const notificationId = req.params.id;
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const result = db.prepare(`
    UPDATE notifications 
    SET isRead = 1 
    WHERE id = ? AND userId = ?
  `).run(notificationId, userId);

  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: "notification_not_found" });
  }

  res.json({ ok: true, message: "הודעה סומנה כנקראה" });
});

