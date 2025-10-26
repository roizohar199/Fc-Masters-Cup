// server/src/utils/ensureSchema.ts
import Database from "better-sqlite3";

export function ensureSchema(db: Database.Database) {
  // tournaments – הוספת שדות אם חסרים
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      game TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const tCols = db.prepare(`PRAGMA table_info('tournaments')`).all() as any[];
  const add = (name: string, sql: string) => {
    if (!tCols.some(c => c.name === name)) db.exec(sql);
  };
  add("current_stage", `ALTER TABLE tournaments ADD COLUMN current_stage TEXT DEFAULT 'R16';`);
  add("is_active", `ALTER TABLE tournaments ADD COLUMN is_active INTEGER DEFAULT 1;`);
  add("deadline", `ALTER TABLE tournaments ADD COLUMN deadline TEXT;`);

  // participants (זרעים/שיוך לשלב)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      stage TEXT NOT NULL,           -- 'R16'|'QF'|'SF'|'F'
      is_selected INTEGER NOT NULL DEFAULT 1,
      result TEXT DEFAULT 'none',    -- 'win'|'lose'|'none'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tournament_id, user_id, stage)
    );
  `);

  // matches (משחקים לכל שלב)
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round TEXT NOT NULL,           -- 'R16'|'QF'|'SF'|'F'
      pos INTEGER NOT NULL,          -- 1..8 לפי שלב
      p1_user_id INTEGER,
      p2_user_id INTEGER,
      winner_user_id INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tournament_id, round, pos)
    );
  `);

  // notifications – ודא עמודה user_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      email TEXT,
      title TEXT,
      body TEXT,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const nCols = db.prepare(`PRAGMA table_info('notifications')`).all() as any[];
  if (!nCols.some(c => c.name === "user_id")) {
    db.exec(`ALTER TABLE notifications ADD COLUMN user_id INTEGER;`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
  }
}