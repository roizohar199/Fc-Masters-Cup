// server/src/utils/ensureSchema.ts
import Database from "better-sqlite3";

type Col = { name: string };

function cols(db: Database.Database, table: string): Col[] {
  try {
    return db.prepare(`PRAGMA table_info(${table})`).all() as Col[];
  } catch { return []; }
}
function has(db: Database.Database, table: string, col: string) {
  return cols(db, table).some(c => c.name === col);
}
function tableExists(db: Database.Database, table: string) {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table) as any;
  return !!row;
}

export function ensureSchema(db: Database.Database) {
  // ---- users (לא נוגעים כאן במבנה; רק מניחים שקיימת) ----
  if (!tableExists(db, "users")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        display_name TEXT,
        psn TEXT,
        status TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_psn   ON users(psn);
    `);
  }

  // ---- tournaments ----
  if (!tableExists(db, "tournaments")) {
    db.exec(`
      CREATE TABLE tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        game TEXT,
        starts_at TEXT,
        current_stage TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(is_active);
    `);
  } else {
    // הוספת עמודות חסרות
    if (!has(db, "tournaments", "name"))        db.exec(`ALTER TABLE tournaments ADD COLUMN name TEXT;`);
    if (!has(db, "tournaments", "game"))        db.exec(`ALTER TABLE tournaments ADD COLUMN game TEXT;`);
    if (!has(db, "tournaments", "starts_at"))   db.exec(`ALTER TABLE tournaments ADD COLUMN starts_at TEXT;`);
    if (!has(db, "tournaments", "current_stage")) db.exec(`ALTER TABLE tournaments ADD COLUMN current_stage TEXT;`);
    if (!has(db, "tournaments", "is_active"))   db.exec(`ALTER TABLE tournaments ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
    if (!has(db, "tournaments", "created_at"))  db.exec(`ALTER TABLE tournaments ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`);

    // אם קיים רק title ללא name – נשכפל
    if (has(db, "tournaments", "title") && !has(db, "tournaments", "name")) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN name TEXT;`);
      db.exec(`UPDATE tournaments SET name = title WHERE name IS NULL;`);
    }
  }

  // ---- tournament_players (שיוך שחקנים לשלב) ----
  if (!tableExists(db, "tournament_players")) {
    db.exec(`
      CREATE TABLE tournament_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        stage TEXT NOT NULL,
        is_selected INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(tournament_id, user_id, stage)
      );
      CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_players(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_tp_user       ON tournament_players(user_id);
      CREATE INDEX IF NOT EXISTS idx_tp_stage      ON tournament_players(stage);
    `);
  } else {
    if (!has(db, "tournament_players", "is_selected"))
      db.exec(`ALTER TABLE tournament_players ADD COLUMN is_selected INTEGER NOT NULL DEFAULT 1;`);
    if (!has(db, "tournament_players", "created_at"))
      db.exec(`ALTER TABLE tournament_players ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`);
  }

  // ---- matches (לוח משחקים) ----
  if (!tableExists(db, "matches")) {
    db.exec(`
      CREATE TABLE matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        round TEXT NOT NULL,
        pos INTEGER NOT NULL,
        p1_user_id INTEGER,
        p2_user_id INTEGER,
        winner_user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_matches_round      ON matches(round);
    `);
  } else {
    if (!has(db, "matches", "winner_user_id"))
      db.exec(`ALTER TABLE matches ADD COLUMN winner_user_id INTEGER;`);
    if (!has(db, "matches", "created_at"))
      db.exec(`ALTER TABLE matches ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`);
  }

  // ---- notifications (אם יש אצלך התראות) ----
  if (!tableExists(db, "notifications")) {
    db.exec(`
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT,
        type TEXT,
        title TEXT,
        body TEXT,
        payload TEXT,
        read_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read_at);
    `);
  } else {
    if (!has(db, "notifications", "user_id"))  db.exec(`ALTER TABLE notifications ADD COLUMN user_id INTEGER;`);
    if (!has(db, "notifications", "read_at"))  db.exec(`ALTER TABLE notifications ADD COLUMN read_at TEXT;`);
  }
}