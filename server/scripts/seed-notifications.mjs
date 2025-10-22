import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
const DB_PATH = process.env.DB_PATH || "./server/tournaments.sqlite";
const db = new Database(DB_PATH);
const now = new Date().toISOString();

db.exec("PRAGMA foreign_keys = ON;");

function ensureTableExists(name) {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(name);
  if (!row) {
    console.error(`Table '${name}' not found. Run migrations first.`);
    process.exit(1);
  }
}
["users","tournaments","tournament_registrations","notifications"].forEach(ensureTableExists);

// משתמשים קיימים או חדשים
const getUserByEmail = db.prepare("SELECT id FROM users WHERE email = ?");

// נבדוק אם המשתמשים כבר קיימים
let u1 = getUserByEmail.get("player1@example.com")?.id;
let u2 = getUserByEmail.get("player2@example.com")?.id;
let u3 = getUserByEmail.get("player3@example.com")?.id;

// אם הם לא קיימים, ניצור אותם
if (!u1) {
  const upsertUser = db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, psnUsername, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `);
  u1 = upsertUser.get(randomUUID(), "player1@example.com", "hashed_password", "player", "PlayerOne", now)?.id;
}

if (!u2) {
  const upsertUser = db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, psnUsername, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `);
  u2 = upsertUser.get(randomUUID(), "player2@example.com", "hashed_password", "player", "PlayerTwo", now)?.id;
}

if (!u3) {
  const upsertUser = db.prepare(`
    INSERT INTO users (id, email, passwordHash, role, psnUsername, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `);
  u3 = upsertUser.get(randomUUID(), "player3@example.com", "hashed_password", "player", "PlayerThree", now)?.id;
}

console.log("Users:", { u1, u2, u3 });

// טורניר לדוגמה (אם אין)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_title ON tournaments(title);
`);
const tRow = db.prepare(`
  INSERT INTO tournaments (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond)
  VALUES (?, 'FC Masters Cup – Demo', 'FC25', 'PS5', 'Asia/Jerusalem', ?, 500, 0)
  ON CONFLICT(title) DO UPDATE SET createdAt=excluded.createdAt
  RETURNING id, title, createdAt
`).get("demo-tournament-1", now);

// צירוף משתתפים
const addPart = db.prepare(`
  INSERT OR IGNORE INTO tournament_registrations (id, tournamentId, userId, state, createdAt, updatedAt)
  VALUES (?, ?, ?, 'registered', ?, ?)
`);
[ u1, u2, u3 ].forEach((uid, idx) => addPart.run(`reg-${uid}-${tRow.id}`, tRow.id, uid, now, now));

// התראות (לא נקראו) לשחקנים 1–2
if (u1 && u2) {
  const addNotif = db.prepare(`
    INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
    VALUES (?, ?, 'tournament', ?, ?, 0, ?)
  `);
  addNotif.run(randomUUID(), u1, "נבחרת להשתתף בטורניר", `נבחרת לטורניר "${tRow.title}". בהצלחה!`, now);
  addNotif.run(randomUUID(), u2, "נבחרת להשתתף בטורניר", `נבחרת לטורניר "${tRow.title}". בהצלחה!`, now);
  console.log("Created notifications for users:", u1, u2);
} else {
  console.log("Skipping notifications - users not found:", { u1, u2 });
}

console.log("Seed completed:", { tournamentId: tRow.id, users: [u1,u2,u3] });
