// server/src/utils/notify.ts
import Database from "better-sqlite3";

type NotifyArgs = {
  userId?: number | null;
  email?: string | null;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  payload?: any; // יישמר כ־JSON
};

export function insertNotification(db: Database.Database, n: NotifyArgs) {
  try {
    const payloadStr = n?.payload ? JSON.stringify(n.payload) : null;

    // בדוק אילו עמודות קיימות עכשיו בפועל
    const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as {name:string}[];
    const hasUserId = cols.some(c => c.name === "user_id");
    const hasType = cols.some(c => c.name === "type");
    const hasTitle = cols.some(c => c.name === "title");
    const hasBody = cols.some(c => c.name === "body");
    const hasPayload = cols.some(c => c.name === "payload");

    console.log("📝 יוצר התראה עם עמודות:", { hasUserId, hasType, hasTitle, hasBody, hasPayload });

    if (hasUserId && hasType && hasTitle && hasBody) {
      // גרסה מלאה עם כל העמודות
      const stmt = db.prepare(`
        INSERT INTO notifications(user_id, email, type, title, body, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        n.userId ?? null, 
        n.email ?? null, 
        n.type ?? null, 
        n.title ?? null, 
        n.body ?? null, 
        payloadStr
      );
      console.log("✅ התראה נוצרה בהצלחה (גרסה מלאה)");
    } else {
      // fallback - רק עם העמודות הקיימות
      const availableCols = [];
      const values = [];
      
      if (hasUserId) {
        availableCols.push('user_id');
        values.push(n.userId ?? null);
      }
      
      if (hasType) {
        availableCols.push('type');
        values.push(n.type ?? null);
      }
      
      if (hasTitle) {
        availableCols.push('title');
        values.push(n.title ?? null);
      }
      
      if (hasBody) {
        availableCols.push('body');
        values.push(n.body ?? null);
      }
      
      if (hasPayload) {
        availableCols.push('payload');
        values.push(payloadStr);
      }
      
      availableCols.push('email');
      values.push(n.email ?? null);
      
      availableCols.push('created_at');
      values.push('datetime("now")');

      const stmt = db.prepare(`
        INSERT INTO notifications(${availableCols.join(', ')})
        VALUES (${availableCols.map(() => '?').join(', ')})
      `);
      stmt.run(...values);
      console.log("✅ התראה נוצרה בהצלחה (fallback)");
    }
  } catch (error) {
    console.warn("⚠️ שגיאה ביצירת התראה:", error);
    // לא נפיל את הבקשה בגלל התראה
  }
}

// פונקציה עזר ליצירת התראה לטורניר
export function createNotification(args: {
  userId: number;
  title: string;
  body: string;
  link?: string;
  type?: string;
}) {
  // נצטרך לקבל את ה-db instance מהקורא
  return {
    userId: args.userId,
    title: args.title,
    body: args.body,
    link: args.link,
    type: args.type || 'tournament_selected'
  };
}

// פונקציות נוספות לניהול התראות
export function listUserNotifications(db: Database.Database, userId: number) {
  try {
    const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as {name:string}[];
    const hasUserId = cols.some(c => c.name === "user_id");
    
    if (hasUserId) {
      return db.prepare(`
        SELECT id, user_id, type, title, body, payload, created_at
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `).all(userId);
    } else {
      // fallback - החזר רשימה ריקה
      return [];
    }
  } catch (error) {
    console.warn("⚠️ שגיאה בטעינת התראות:", error);
    return [];
  }
}

export function markNotificationRead(db: Database.Database, userId: number, notificationId: number) {
  try {
    const cols = db.prepare(`PRAGMA table_info('notifications')`).all() as {name:string}[];
    const hasUserId = cols.some(c => c.name === "user_id");
    
    if (hasUserId) {
      db.prepare(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE id = ? AND user_id = ?
      `).run(notificationId, userId);
    }
  } catch (error) {
    console.warn("⚠️ שגיאה בסימון התראה כנקראה:", error);
  }
}