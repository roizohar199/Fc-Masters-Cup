import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { authenticate, registerUser, signToken, decodeToken, createPasswordResetToken, resetPassword } from "../src/auth.js";
import { randomUUID } from "node:crypto";

// יצירת DB לבדיקות בלבד
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

describe("Authentication Tests", () => {
  const testEmail = "test@example.com";
  const testPassword = "SecurePassword123!";

  it("should register a new user", async () => {
    const user = await registerUser(testEmail, testPassword);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.role).toBe("player");
  });

  it("should not register duplicate email", async () => {
    const duplicate = await registerUser(testEmail, testPassword);
    expect(duplicate).toBeNull();
  });

  it("should authenticate with correct credentials", async () => {
    const user = await authenticate(testEmail, testPassword);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
  });

  it("should fail authentication with wrong password", async () => {
    const user = await authenticate(testEmail, "WrongPassword");
    expect(user).toBeNull();
  });

  it("should fail authentication with non-existent email", async () => {
    const user = await authenticate("nonexistent@example.com", testPassword);
    expect(user).toBeNull();
  });

  it("should sign and decode JWT token", () => {
    const payload = { uid: randomUUID(), email: testEmail, role: "player" };
    const token = signToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = decodeToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.email).toBe(testEmail);
    expect(decoded?.role).toBe("player");
  });

  it("should fail to decode invalid token", () => {
    const decoded = decodeToken("invalid-token");
    expect(decoded).toBeNull();
  });

  it("should create password reset token", () => {
    const token = createPasswordResetToken(testEmail);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("should reset password with valid token", async () => {
    const token = createPasswordResetToken(testEmail);
    const newPassword = "NewSecurePassword456!";
    const success = await resetPassword(token, newPassword);
    expect(success).toBe(true);

    // בדיקה שהסיסמה החדשה עובדת
    const user = await authenticate(testEmail, newPassword);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
  });

  it("should fail to reset password with invalid token", async () => {
    const success = await resetPassword("invalid-token", "NewPassword123!");
    expect(success).toBe(false);
  });

  it("should fail to reset password with expired token", async () => {
    // יצירת טוקן שפג תוקפו (עבר יום שעבר)
    const expiredToken = randomUUID();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    testDb.prepare(`
      INSERT INTO password_resets (id, email, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), testEmail, expiredToken, yesterday, yesterday);

    const success = await resetPassword(expiredToken, "NewPassword789!");
    expect(success).toBe(false);
  });
});

describe("Token Security Tests", () => {
  it("should not accept tampered tokens", () => {
    const payload = { uid: randomUUID(), email: "user@example.com", role: "player" };
    const token = signToken(payload);
    
    // שינוי התוכן של הטוקן (תמפור)
    const tamperedToken = token.slice(0, -5) + "XXXXX";
    const decoded = decodeToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  it("should not accept tokens without signature", () => {
    const payload = Buffer.from(JSON.stringify({ uid: "123", email: "user@example.com" })).toString("base64");
    const decoded = decodeToken(payload);
    expect(decoded).toBeNull();
  });
});

describe("Role-Based Access Tests", () => {
  it("should create admin user with admin role", async () => {
    const adminEmail = "admin@example.com";
    const adminPassword = "AdminPassword123!";
    
    const admin = await registerUser(adminEmail, adminPassword, "admin");
    expect(admin).toBeDefined();
    expect(admin?.email).toBe(adminEmail);
    expect(admin?.role).toBe("admin");
  });

  it("should maintain role in token", () => {
    const adminPayload = { uid: randomUUID(), email: "admin@example.com", role: "admin" };
    const adminToken = signToken(adminPayload);
    const decoded = decodeToken(adminToken);
    
    expect(decoded).toBeDefined();
    expect(decoded?.role).toBe("admin");
  });
});
