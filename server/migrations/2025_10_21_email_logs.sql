CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,      -- 'SENT' | 'ERROR'
  error TEXT,
  message_id TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

