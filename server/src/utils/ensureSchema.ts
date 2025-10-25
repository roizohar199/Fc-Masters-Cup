// server/src/utils/ensureSchema.ts
import Database from "better-sqlite3";

export function ensureSchema(db: Database.Database) {
  console.log("🔧 בודק ומעדכן סכמת מסד הנתונים...");
  
  // יצירת טבלת notifications אם לא קיימת כלל
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- שדות קיימים אפשריים; לא נניח שמות, נוסיף בהמשך user_id אם חסר
      type TEXT,
      email TEXT,
      title TEXT,
      body TEXT,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // בדיקה אם user_id חסר - נוסיף אותו
  const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as {name:string}[];
  const hasUserId = cols.some(c => c.name === "user_id");
  
  if (!hasUserId) {
    console.log("➕ מוסיף עמודה user_id לטבלת notifications...");
    try {
      db.exec(`ALTER TABLE notifications ADD COLUMN user_id INTEGER;`);
      // אינדקס (לא חובה, אבל טוב שיהיה)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
      console.log("✅ עמודה user_id נוספה בהצלחה");
    } catch (error) {
      console.warn("⚠️ לא ניתן להוסיף עמודה user_id:", error);
    }
  } else {
    console.log("✅ עמודה user_id כבר קיימת");
  }

  // וידוא שיש את כל העמודות הנדרשות
  const requiredColumns = ['id', 'user_id', 'type', 'title', 'body', 'created_at'];
  const existingColumns = cols.map(c => c.name);
  
  for (const col of requiredColumns) {
    if (!existingColumns.includes(col)) {
      console.log(`➕ מוסיף עמודה ${col} לטבלת notifications...`);
      try {
        if (col === 'user_id') {
          db.exec(`ALTER TABLE notifications ADD COLUMN user_id INTEGER;`);
        } else if (col === 'type') {
          db.exec(`ALTER TABLE notifications ADD COLUMN type TEXT;`);
        } else if (col === 'title') {
          db.exec(`ALTER TABLE notifications ADD COLUMN title TEXT;`);
        } else if (col === 'body') {
          db.exec(`ALTER TABLE notifications ADD COLUMN body TEXT;`);
        } else if (col === 'created_at') {
          db.exec(`ALTER TABLE notifications ADD COLUMN created_at TEXT DEFAULT (datetime('now'));`);
        }
        console.log(`✅ עמודה ${col} נוספה בהצלחה`);
      } catch (error) {
        console.warn(`⚠️ לא ניתן להוסיף עמודה ${col}:`, error);
      }
    }
  }

  console.log("✅ סכמת מסד הנתונים עודכנה בהצלחה");
}
