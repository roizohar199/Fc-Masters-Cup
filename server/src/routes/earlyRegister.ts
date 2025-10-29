import { Router } from "express";
import Database from "better-sqlite3";
import db from "../db.js";
import { decodeToken } from "../auth.js";
import { uuid } from "../utils/ids.js";
import { nowISO } from "../lib/util.js";

const router = Router();

// סוגרים OPTIONS מייד
router.options("/", (_req, res) => res.sendStatus(204));

// ✅ יצירת טבלת הבעות עניין (אם לא קיימת)
// טבלה זו תשמור הבעות עניין כלליות - לא קשורות לטורניר ספציפי
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_interests (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_interests_user ON tournament_interests(userId);
    CREATE INDEX IF NOT EXISTS idx_interests_created ON tournament_interests(createdAt);
  `);
  console.log("[early-register] ✅ Tournament interests table ready");
} catch (e) {
  console.error("[early-register] ⚠️ Error creating interests table:", e);
}

type AppDb = Database.Database;
type InterestRow = { id: string; userId: string; createdAt: string; updatedAt: string };

// ====== עזר: גזירת userId בצורה עמידה (JWT/email/headers) - עובד עם UUID/TEXT ======
function deriveUserId(req: any): string | null {
  // ✅ ניסיון ראשון: מועמדים ישירים ממידלוורים
  const direct = [
    req.user?.id,
    req.user?.uid,
    resLocalUser(req)?.id,
    req.session?.user?.id,
    req.auth?.user?.id,
    req.headers["x-user-id"]
  ];
  for (const v of direct) {
    if (v) {
      const userId = String(v).trim();
      if (userId && userId.length > 0) {
        console.log("[early-register] Found userId from direct source:", userId);
        return userId;
      }
    }
  }

  // ✅ ניסיון שני: JWT מ-cookie/header (עובד עם UUID)
  try {
    const COOKIE_NAME = "session";
    const token = req.cookies?.[COOKIE_NAME] || 
                  req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
                  req.headers["x-auth-token"];
    
    if (token) {
      console.log("[early-register] Found token in cookies/headers");
      const decoded = decodeToken(token);
      
      if (decoded) {
        // ניסיון 1: מזהה ישיר מהטוקן (UUID או מספר)
        const directId = decoded.userId || decoded.id || decoded.sub || decoded.uid;
        if (directId) {
          const userId = String(directId).trim();
          if (userId && userId.length > 0) {
            console.log("[early-register] Found userId from JWT direct:", userId);
            return userId;
          }
        }

        // ניסיון 2: חיפוש לפי email (עובד גם עם UUID)
        const email = decoded.email || decoded.user?.email;
        if (email) {
          const user = db.prepare(`SELECT id FROM users WHERE email=? LIMIT 1`).get(email) as any;
          if (user && user.id) {
            const userId = String(user.id).trim();
            console.log("[early-register] Found userId from JWT email lookup:", userId);
            return userId;
          }
        }
      }
    }
  } catch (e) {
    console.log("[early-register] JWT decode failed:", e);
  }

  return null;
}

// ====== עזר: ספירת כל המביעים עניין (כללי, לא לטורניר ספציפי) ======
function getTotalInterestsCount(): number {
  try {
    const countRow = db.prepare<[], { n: number } | undefined>(
      `SELECT COUNT(*) AS n FROM tournament_interests`
    ).get() as { n: number } | undefined;
    return Number(countRow?.n || 0);
  } catch (e) {
    console.error("[early-register] Error counting interests:", e);
    return 0;
  }
}

function resLocalUser(req: any) {
  // לעיתים שומרים משתמש ב-res.locals.user או ב-app.locals.currentUser
  try { return req.res?.locals?.user || req.app?.locals?.currentUser; } catch { return null; }
}

router.post("/", async (req, res) => {
  // ✅ גזירת userId מה-JWT/cookies (עובד עם UUID)
  // ❌ לא צריך tournamentId - זו הבעת עניין כללית!
  const userId = deriveUserId(req);

  // לוג אבחוני מפורט
  console.log("[early-register] incoming:", {
    body: req.body,
    query: req.query,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    finalUserId: userId,
    note: "General interest registration (no specific tournament)"
  });

  if (!userId || userId.length === 0) {
    console.warn("[early-register] USER_NOT_AUTHENTICATED - could not derive userId");
    return res.status(401).json({ ok: false, error: "USER_NOT_AUTHENTICATED" });
  }

  try {
    // ✅ חיפוש הבעת עניין קיימת (לא קשורה לטורניר ספציפי)
    const existing = db
      .prepare<[string], InterestRow | undefined>(
        `SELECT id, userId, createdAt, updatedAt
         FROM tournament_interests
         WHERE userId = ?
         LIMIT 1`
      )
      .get(userId) as InterestRow | undefined;

    // ✅ פונקציה עזר לשליחת מייל למנהל
    const sendNotificationEmail = async (isNew: boolean) => {
      try {
        console.log(`[early-register] Preparing to send email (isNew: ${isNew})...`);
        
        // איסוף מידע על המשתמש (בלי טורניר!)
        const user = db.prepare<[string], { email: string; psnUsername: string | null } | undefined>(
          `SELECT email, psnUsername FROM users WHERE id=? LIMIT 1`
        ).get(userId) as { email: string; psnUsername: string | null } | undefined;

        if (!user) {
          console.warn('[early-register] ⚠️ Could not find user for email notification:', userId);
          return;
        }

        // ספירת כל המביעים עניין (כללי)
        const totalCount = getTotalInterestsCount();

        console.log(`[early-register] 📧 Sending interest notification to admin for user: ${user.email}, total interested: ${totalCount}`);

        // שליחת המייל (לא חוסם את התשובה)
        const { sendEarlyRegistrationEmail } = await import("../email.js");
        const result = await sendEarlyRegistrationEmail({
          userEmail: user.email,
          userPsn: user.psnUsername || user.email.split('@')[0],
          tournamentTitle: "טורניר כללי", // לא טורניר ספציפי
          totalCount: totalCount,
        });
        
        if (result) {
          console.log('[early-register] ✅ Interest notification email sent successfully to admin');
        } else {
          console.warn('[early-register] ⚠️ Email send returned false (check SMTP config)');
        }
      } catch (error) {
        console.error('[early-register] ❌ Error sending interest notification email:', error);
        // לא נכשיל את הבקשה אם המייל נכשל
      }
    };

    if (existing) {
      // עדכון תאריך עדכון (המשתמש לחץ שוב על "אני בפנים")
      db.prepare<[string, string]>(`UPDATE tournament_interests SET updatedAt=? WHERE id=?`)
        .run(nowISO(), existing.id);

      // ✅ שליחת מייל גם בעדכון (אם רוצים - אפשר להסיר)
      sendNotificationEmail(false).catch(e => {
        console.error('[early-register] Failed to send email for existing interest:', e);
      });

      return res.json({
        ok: true,
        interestId: existing.id,
        updated: true,
        totalCount: getTotalInterestsCount(),
      });
    }

    // ✅ יצירת הבעת עניין חדשה (לא קשורה לטורניר)
    const interestId = uuid();
    const now = nowISO();
    db.prepare<[string, string, string, string]>(
      `INSERT INTO tournament_interests (id, userId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?)`
    ).run(interestId, userId, now, now);

    // ✅ שליחת מייל למנהל על הבעת עניין חדשה
    sendNotificationEmail(true).catch(e => {
      console.error('[early-register] Failed to send email for new interest:', e);
    });

    const totalCount = getTotalInterestsCount();

    return res.status(201).json({
      ok: true,
      interestId: interestId,
      totalCount: totalCount,
      message: "הבעת עניין נרשמה בהצלחה",
    });
  } catch (err) {
    console.error("early-register error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

export default router;