import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// נתיב קבוע למסד נתונים - תמיד server/tournaments.sqlite
// מ-server/dist/db.js -> חזור לתיקיית server
const serverDir = path.resolve(__dirname, "..");
const defaultDbPath = path.join(serverDir, "tournaments.sqlite");
const dbPath = process.env.DB_PATH || defaultDbPath;

console.log(`🔧 Server directory: ${serverDir}`);

const db = new Database(dbPath);
console.log(`📂 Database path: ${dbPath}`);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  psn TEXT NOT NULL,
  displayName TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  platform TEXT NOT NULL,
  timezone TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  prizeFirst INTEGER NOT NULL,
  prizeSecond INTEGER NOT NULL,
  nextTournamentDate TEXT,
  telegramLink TEXT
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournamentId TEXT NOT NULL,
  round TEXT NOT NULL,
  homeId TEXT NOT NULL,
  awayId TEXT NOT NULL,
  homeScore INTEGER,
  awayScore INTEGER,
  status TEXT NOT NULL,
  token TEXT NOT NULL,
  pin TEXT NOT NULL,
  evidenceHome TEXT,
  evidenceAway TEXT,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  matchId TEXT NOT NULL,
  reporterPsn TEXT NOT NULL,
  scoreHome INTEGER NOT NULL,
  scoreAway INTEGER NOT NULL,
  pin TEXT NOT NULL,
  evidencePath TEXT,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  secondPrizeCredit REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  psnUsername TEXT,
  createdAt TEXT NOT NULL,
  passwordChangedAt TEXT
);
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  requesterId TEXT NOT NULL,
  requesterEmail TEXT NOT NULL,
  actionType TEXT NOT NULL,
  targetUserId TEXT NOT NULL,
  targetUserEmail TEXT NOT NULL,
  actionData TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL,
  resolvedAt TEXT,
  resolvedBy TEXT
);

-- Performance Indexes - Speed up common queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournamentId);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(homeId);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(awayId);
CREATE INDEX IF NOT EXISTS idx_submissions_match ON submissions(matchId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_target ON approval_requests(targetUserId);

-- Advance operations table for tracking advance operations with idempotency
CREATE TABLE IF NOT EXISTS advance_operations (
  id TEXT PRIMARY KEY,
  tournamentId TEXT NOT NULL,
  round TEXT NOT NULL,
  winners TEXT NOT NULL, -- JSON array of winner IDs
  seeds TEXT, -- JSON array of seed information
  idempotencyKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  revertedAt TEXT,
  reverted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE INDEX IF NOT EXISTS idx_advance_operations_tournament ON advance_operations(tournamentId);
CREATE INDEX IF NOT EXISTS idx_advance_operations_round ON advance_operations(round);
CREATE INDEX IF NOT EXISTS idx_advance_operations_key ON advance_operations(idempotencyKey);
`);

export default db;

// --- Lightweight migrations: ensure new columns exist on old databases ---
try {
  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as any[];
  const have = new Set(userCols.map((c: any) => c.name));
  // add columns if missing (older db files)
  if (!have.has('status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (!have.has('secondPrizeCredit')) {
    db.exec("ALTER TABLE users ADD COLUMN secondPrizeCredit REAL NOT NULL DEFAULT 0");
  }
  if (!have.has('psnUsername')) {
    db.exec("ALTER TABLE users ADD COLUMN psnUsername TEXT");
  }
  if (!have.has('approvalStatus')) {
    db.exec("ALTER TABLE users ADD COLUMN approvalStatus TEXT NOT NULL DEFAULT 'approved'");
    console.log("✅ Added approvalStatus column to users table");
  }
  if (!have.has('approvalToken')) {
    db.exec("ALTER TABLE users ADD COLUMN approvalToken TEXT");
    console.log("✅ Added approvalToken column to users table");
  }
  if (!have.has('isSuperAdmin')) {
    db.exec("ALTER TABLE users ADD COLUMN isSuperAdmin INTEGER NOT NULL DEFAULT 0");
    console.log("✅ Added isSuperAdmin column to users table");
  }
  if (!have.has('passwordChangedAt')) {
    db.exec("ALTER TABLE users ADD COLUMN passwordChangedAt TEXT");
    console.log("✅ Added passwordChangedAt column to users table");
  }
  
  // הגדרת מנהל העל לפי ADMIN_EMAIL
  const superAdminEmail = process.env.ADMIN_EMAIL;
  if (superAdminEmail) {
    const superAdminUser = db.prepare(`SELECT id FROM users WHERE email=?`).get(superAdminEmail);
    if (superAdminUser) {
      db.prepare(`UPDATE users SET isSuperAdmin=1 WHERE email=?`).run(superAdminEmail);
      console.log(`✅ Set ${superAdminEmail} as Super Admin`);
    }
  }
  
  // תיקון משתמשים ללא תאריך הצטרפות
  const usersWithoutDate = db.prepare(`SELECT id FROM users WHERE createdAt IS NULL OR createdAt = ''`).all();
  if (usersWithoutDate.length > 0) {
    console.log(`Found ${usersWithoutDate.length} users without createdAt, fixing...`);
    const updateStmt = db.prepare(`UPDATE users SET createdAt = ? WHERE id = ?`);
    const defaultDate = new Date().toISOString();
    usersWithoutDate.forEach((user: any) => {
      updateStmt.run(defaultDate, user.id);
    });
    console.log(`Fixed ${usersWithoutDate.length} users with default createdAt`);
  }
  
  // אישור אוטומטי למשתמשים קיימים (כדי שלא ינעלו)
  const existingUsers = db.prepare(`SELECT id FROM users WHERE approvalStatus IS NULL OR approvalStatus = ''`).all();
  if (existingUsers.length > 0) {
    console.log(`Auto-approving ${existingUsers.length} existing users...`);
    const approveStmt = db.prepare(`UPDATE users SET approvalStatus = 'approved' WHERE id = ?`);
    existingUsers.forEach((user: any) => {
      approveStmt.run(user.id);
    });
    console.log(`✅ Auto-approved ${existingUsers.length} existing users`);
  }
} catch {}

