-- טבלת התראות למשתמשים
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'info', -- info|tournament|system
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- עמודות עזר לבחירת משתתפים (אם הטבלה קיימת)
-- ALTER TABLE tournament_registrations ADD COLUMN selected_at DATETIME;
-- ALTER TABLE tournament_registrations ADD COLUMN notified_at DATETIME;

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_kind ON notifications(kind);
