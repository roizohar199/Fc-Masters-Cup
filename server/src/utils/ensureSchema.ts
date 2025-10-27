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
  // ---- users (fallback אם לא קיימת) ----
  if (!tableExists(db, "users")) {
    db.exec(`
      CREATE TABLE users (
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
    const hasName  = has(db, "tournaments", "name");
    const hasTitle = has(db, "tournaments", "title");

    // אם יש title בלי name – נוסיף name ונסנכרן
    if (!hasName && hasTitle) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN name TEXT;`);
      db.exec(`UPDATE tournaments SET name = title WHERE name IS NULL;`);
    }

    // אם יש גם name וגם title – ודא שאין רשומות עם title ריק בזמן שהשם קיים
    if (hasName && hasTitle) {
      db.exec(`UPDATE tournaments SET title = COALESCE(title, name) WHERE title IS NULL;`);
    }

    if (!has(db, "tournaments", "name"))          db.exec(`ALTER TABLE tournaments ADD COLUMN name TEXT;`);
    if (!has(db, "tournaments", "game"))          db.exec(`ALTER TABLE tournaments ADD COLUMN game TEXT;`);
    if (!has(db, "tournaments", "starts_at"))     db.exec(`ALTER TABLE tournaments ADD COLUMN starts_at TEXT;`);
    if (!has(db, "tournaments", "current_stage")) db.exec(`ALTER TABLE tournaments ADD COLUMN current_stage TEXT;`);
    if (!has(db, "tournaments", "is_active"))     db.exec(`ALTER TABLE tournaments ADD COLUMN is_active INTEGER; UPDATE tournaments SET is_active=1 WHERE is_active IS NULL;`);
    
    // ✅ PLATFORM – להוסיף אם חסר ולבצע BACKFILL
    if (!has(db, "tournaments", "platform")) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN platform TEXT;`);
    }
    // נמלא רשומות ישנות שבהן אין פלטפורמה (גם אם העמודה NOT NULL)
    db.exec(`UPDATE tournaments SET platform = COALESCE(NULLIF(platform,''),'ps5') WHERE platform IS NULL OR platform = '';`);
    
    // ✅ TIMEZONE – להוסיף אם חסר ולבצע BACKFILL
    if (!has(db, "tournaments", "timezone")) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN timezone TEXT;`);
    }
    // נמלא רשומות ישנות שבהן אין timezone (גם אם העמודה NOT NULL)
    db.exec(`UPDATE tournaments SET timezone = COALESCE(NULLIF(timezone,''),'Asia/Jerusalem') WHERE timezone IS NULL OR timezone = '';`);

    // ⛔ בלי DEFAULT לא-קבוע: מוסיפים עמודה ואז ממלאים ערך קיים
    if (!has(db, "tournaments", "created_at")) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN created_at TEXT;`);
      db.exec(`UPDATE tournaments SET created_at = datetime('now') WHERE created_at IS NULL;`);
    }

    // אם יש title היסטורי – לשכפל ל-name (רק אם חסר)
    if (has(db, "tournaments", "title") && has(db, "tournaments", "name")) {
      db.exec(`UPDATE tournaments SET name = COALESCE(name, title) WHERE name IS NULL;`);
    }
  }

  // ---- tournament_players ----
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
      db.exec(`ALTER TABLE tournament_players ADD COLUMN is_selected INTEGER; UPDATE tournament_players SET is_selected=1 WHERE is_selected IS NULL;`);

    if (!has(db, "tournament_players", "created_at")) {
      db.exec(`ALTER TABLE tournament_players ADD COLUMN created_at TEXT;`);
      db.exec(`UPDATE tournament_players SET created_at = datetime('now') WHERE created_at IS NULL;`);
    }
  }

  // ---- matches ----
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

    if (!has(db, "matches", "created_at")) {
      db.exec(`ALTER TABLE matches ADD COLUMN created_at TEXT;`);
      db.exec(`UPDATE matches SET created_at = datetime('now') WHERE created_at IS NULL;`);
    }
  }

  // ---- notifications ----
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
    if (!has(db, "notifications", "user_id"))
      db.exec(`ALTER TABLE notifications ADD COLUMN user_id INTEGER;`);

    if (!has(db, "notifications", "read_at"))
      db.exec(`ALTER TABLE notifications ADD COLUMN read_at TEXT;`);

    if (!has(db, "notifications", "created_at")) {
      db.exec(`ALTER TABLE notifications ADD COLUMN created_at TEXT;`);
      db.exec(`UPDATE notifications SET created_at = datetime('now') WHERE created_at IS NULL;`);
    }
  }
}