import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { authenticate, registerUser, signToken, decodeToken } from "../src/auth.js";
import { generateRoundOf16, advanceWinners } from "../src/lib/bracket.js";
import { randomUUID } from "node:crypto";

// יצירת DB לבדיקות אינטגרציה
let testDb: Database.Database;

beforeAll(() => {
  testDb = new Database(":memory:");
  testDb.exec(`
    CREATE TABLE users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      secondPrizeCredit INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE tournaments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      game TEXT NOT NULL,
      platform TEXT NOT NULL,
      timezone TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      prizeFirst INTEGER DEFAULT 0,
      prizeSecond INTEGER DEFAULT 0
    );
    CREATE TABLE matches (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      round TEXT NOT NULL,
      homeId TEXT NOT NULL,
      awayId TEXT NOT NULL,
      homeScore INTEGER DEFAULT NULL,
      awayScore INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
});

afterAll(() => {
  testDb.close();
});

beforeEach(() => {
  // ניקוי נתונים בין בדיקות
  testDb.exec("DELETE FROM matches;");
  testDb.exec("DELETE FROM tournaments;");
  testDb.exec("DELETE FROM users;");
  testDb.exec("DELETE FROM password_resets;");
});

describe("Integration Tests - System Functionality", () => {
  describe("User Registration and Authentication Flow", () => {
    it("should complete full user registration and login flow", async () => {
      const email = "integration@test.com";
      const password = "IntegrationTest123!";
      
      // רישום משתמש
      const user = await registerUser(email, password);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.role).toBe("player");
      
      // התחברות
      const authUser = await authenticate(email, password);
      expect(authUser).toBeDefined();
      expect(authUser?.email).toBe(email);
      
      // יצירת טוקן
      const token = signToken({ uid: user.uid, email: user.email, role: user.role });
      expect(token).toBeDefined();
      
      // פענוח טוקן
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe(email);
    });

    it("should handle multiple user registrations", async () => {
      const users = [];
      for (let i = 0; i < 5; i++) {
        const email = `user${i}@test.com`;
        const password = `Password${i}123!`;
        const user = await registerUser(email, password);
        expect(user).toBeDefined();
        users.push(user);
      }
      
      expect(users).toHaveLength(5);
      expect(users.every(u => u?.email?.includes("@test.com"))).toBe(true);
    });
  });

  describe("Tournament Management", () => {
    it("should create tournament and generate bracket", () => {
      const tournamentId = randomUUID();
      const now = new Date().toISOString();
      
      // יצירת טורניר
      testDb.prepare(`
        INSERT INTO tournaments (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tournamentId, "Integration Test Tournament", "FC25", "PS5", "Asia/Jerusalem", now, 1000, 500);
      
      // יצירת 16 שחקנים
      const playerIds = Array.from({ length: 16 }, () => randomUUID());
      
      // יצירת סיבוב 16
      const matchIds = generateRoundOf16(tournamentId, playerIds);
      expect(matchIds).toHaveLength(8);
      
      // בדיקה שהמשחקים נוצרו במסד הנתונים
      const matches = testDb.prepare(`
        SELECT * FROM matches WHERE tournamentId = ? AND round = 'R16'
      `).all(tournamentId);
      
      expect(matches).toHaveLength(8);
      expect(matches.every(m => m.status === 'PENDING')).toBe(true);
    });

    it("should advance winners from R16 to QF", () => {
      const tournamentId = randomUUID();
      const now = new Date().toISOString();
      
      // יצירת טורניר
      testDb.prepare(`
        INSERT INTO tournaments (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tournamentId, "Advance Test Tournament", "FC25", "PS5", "Asia/Jerusalem", now, 1000, 500);
      
      // יצירת 16 שחקנים וסיבוב 16
      const playerIds = Array.from({ length: 16 }, () => randomUUID());
      generateRoundOf16(tournamentId, playerIds);
      
      // אישור תוצאות לכל המשחקים
      const matches = testDb.prepare(`
        SELECT id FROM matches WHERE tournamentId = ? AND round = 'R16'
      `).all(tournamentId);
      
      for (const match of matches) {
        testDb.prepare(`
          UPDATE matches SET homeScore = ?, awayScore = ?, status = 'CONFIRMED' WHERE id = ?
        `).run(2, 1, match.id);
      }
      
      // קידום מנצחים
      const qfMatches = advanceWinners(tournamentId, "R16");
      expect(qfMatches).toHaveLength(4);
      
      // בדיקה שהמשחקים החדשים נוצרו
      const qfMatchesInDb = testDb.prepare(`
        SELECT * FROM matches WHERE tournamentId = ? AND round = 'QF'
      `).all(tournamentId);
      
      expect(qfMatchesInDb).toHaveLength(4);
    });
  });

  describe("Database Integrity", () => {
    it("should maintain referential integrity", () => {
      const tournamentId = randomUUID();
      const playerId = randomUUID();
      const matchId = randomUUID();
      const now = new Date().toISOString();
      
      // יצירת טורניר
      testDb.prepare(`
        INSERT INTO tournaments (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tournamentId, "Integrity Test", "FC25", "PS5", "Asia/Jerusalem", now, 1000, 500);
      
      // יצירת משחק עם שחקנים שלא קיימים (צריך להיכשל)
      expect(() => {
        testDb.prepare(`
          INSERT INTO matches (id, tournamentId, round, homeId, awayId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(matchId, tournamentId, "R16", playerId, randomUUID(), now);
      }).toThrow();
    });

    it("should handle concurrent operations", async () => {
      const promises = [];
      
      // יצירת 10 משתמשים במקביל
      for (let i = 0; i < 10; i++) {
        promises.push(registerUser(`concurrent${i}@test.com`, `Password${i}123!`));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(r => r !== null)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid email formats", async () => {
      const invalidEmails = [
        "invalid-email",
        "@test.com",
        "test@",
        "",
        "test..test@test.com"
      ];
      
      for (const email of invalidEmails) {
        const user = await registerUser(email, "ValidPassword123!");
        // המערכת צריכה לדחות מיילים לא תקינים
        expect(user).toBeNull();
      }
    });

    it("should handle weak passwords", async () => {
      const weakPasswords = [
        "123",
        "password",
        "PASSWORD",
        "12345678",
        "abc"
      ];
      
      for (const password of weakPasswords) {
        const user = await registerUser("test@example.com", password);
        // המערכת צריכה לדחות סיסמאות חלשות
        expect(user).toBeNull();
      }
    });

    it("should handle database connection issues gracefully", () => {
      // סגירת המסד נתונים
      testDb.close();
      
      // ניסיון לבצע פעולה (צריך להיכשל בצורה מבוקרת)
      expect(() => {
        testDb.prepare("SELECT 1").get();
      }).toThrow();
    });
  });

  describe("Performance Tests", () => {
    it("should handle large number of matches efficiently", () => {
      const tournamentId = randomUUID();
      const now = new Date().toISOString();
      
      // יצירת טורניר
      testDb.prepare(`
        INSERT INTO tournaments (id, title, game, platform, timezone, createdAt, prizeFirst, prizeSecond)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tournamentId, "Performance Test", "FC25", "PS5", "Asia/Jerusalem", now, 1000, 500);
      
      const startTime = Date.now();
      
      // יצירת 100 משחקים
      const playerIds = Array.from({ length: 200 }, () => randomUUID());
      for (let i = 0; i < 100; i++) {
        testDb.prepare(`
          INSERT INTO matches (id, tournamentId, round, homeId, awayId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(randomUUID(), tournamentId, "R16", playerIds[i * 2], playerIds[i * 2 + 1], now);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // הבדיקה צריכה להסתיים תוך זמן סביר (פחות מ-5 שניות)
      expect(duration).toBeLessThan(5000);
      
      // בדיקה שכל המשחקים נוצרו
      const matchCount = testDb.prepare(`
        SELECT COUNT(*) as count FROM matches WHERE tournamentId = ?
      `).get(tournamentId);
      
      expect(matchCount.count).toBe(100);
    });
  });
});

describe("System Health Checks", () => {
  it("should verify all critical tables exist", () => {
    const tables = testDb.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('tournaments');
    expect(tableNames).toContain('matches');
    expect(tableNames).toContain('password_resets');
  });

  it("should verify database schema integrity", () => {
    // בדיקת מבנה טבלת משתמשים
    const userSchema = testDb.prepare(`
      PRAGMA table_info(users)
    `).all();
    
    const userColumns = userSchema.map(c => c.name);
    expect(userColumns).toContain('uid');
    expect(userColumns).toContain('email');
    expect(userColumns).toContain('password');
    expect(userColumns).toContain('role');
    expect(userColumns).toContain('status');
  });
});
