import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import db from "./db.js";
import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8787/api/auth/google/callback";

export function setupGoogleAuth() {
  console.log("Google OAuth Setup:");
  console.log("- CLIENT_ID:", GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing");
  console.log("- CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing");
  console.log("- CALLBACK_URL:", GOOGLE_CALLBACK_URL);
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn("googleAuth", "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google OAuth disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            console.error("Google OAuth: No email in profile");
            return done(new Error("No email from Google"), undefined);
          }

          console.log("Google OAuth: Processing user:", email);

          // בדוק אם המשתמש קיים
          let user = db.prepare(`SELECT id, email FROM users WHERE email=?`).get(email) as any;

          // אם לא קיים, צור משתמש חדש (ללא סיסמה - OAuth בלבד)
          if (!user) {
            const userId = randomUUID();
            console.log("Google OAuth: Creating new user:", email);
            
            db.prepare(`INSERT INTO users (id, email, passwordHash, createdAt, role, status, approvalStatus) VALUES (?, ?, ?, ?, ?, ?, ?)`)
              .run(userId, email, "", new Date().toISOString(), 'player', 'active', 'approved');
            user = { id: userId, email };
            
            console.log("Google OAuth: New user created:", userId);
          } else {
            console.log("Google OAuth: Existing user found:", user.id);
          }

          return done(null, { uid: user.id, email: user.email });
        } catch (error) {
          console.error("Google OAuth strategy error:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  logger.success("googleAuth", "Google OAuth configured successfully");
}

