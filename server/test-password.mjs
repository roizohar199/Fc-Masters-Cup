import Database from "better-sqlite3";
import argon2 from "argon2";

const email = process.argv[2] || "yosiyoviv@gmail.com";
const password = process.argv[3] || "Yosi1234";

console.log("\n🔐 בודק התחברות עבור:");
console.log(`   Email: ${email}`);
console.log(`   Password: ${password}\n`);

const db = new Database("./tournaments.sqlite");

try {
  const user = db.prepare(`SELECT id, email, passwordHash, role, status FROM users WHERE email = ?`).get(email);
  
  if (!user) {
    console.log("❌ המשתמש לא נמצא\n");
    process.exit(1);
  }

  console.log("✅ משתמש נמצא במסד הנתונים");
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status}`);
  
  if (user.status === "blocked") {
    console.log("\n❌ המשתמש חסום! לא יכול להתחבר.\n");
    process.exit(1);
  }

  console.log("\n🔐 בודק אימות סיסמה...");
  
  const isValid = await argon2.verify(user.passwordHash, password);
  
  if (isValid) {
    console.log("✅ הסיסמה נכונה! ההתחברות אמורה לעבוד.");
    console.log("\n📝 נסה להתחבר עם:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
  } else {
    console.log("❌ הסיסמה שגויה!");
    console.log("\n💡 הסיסמה שהזנת לא תואמת למה שבמסד הנתונים.");
    console.log("   נסה לאפס אותה שוב:\n");
    console.log(`   node reset-user-password.mjs ${email} <סיסמה-חדשה>\n`);
  }
  
} catch (error) {
  console.error("\n❌ שגיאה:", error.message);
  process.exit(1);
} finally {
  db.close();
}

