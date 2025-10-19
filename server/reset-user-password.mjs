import Database from "better-sqlite3";
import argon2 from "argon2";

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("\n❌ שימוש: node reset-user-password.mjs <email> <password>");
  console.log("דוגמה: node reset-user-password.mjs yosiyoviv@gmail.com MyNewPass123\n");
  process.exit(1);
}

const db = new Database("./tournaments.sqlite");

try {
  // בדוק אם המשתמש קיים
  const user = db.prepare("SELECT id, email, role, status FROM users WHERE email = ?").get(email);
  
  if (!user) {
    console.log(`\n❌ המשתמש ${email} לא נמצא במערכת\n`);
    process.exit(1);
  }

  console.log("\n📋 משתמש נמצא:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status}`);
  
  // בדוק אם המשתמש חסום
  if (user.status === 'blocked') {
    console.log("\n⚠️  אזהרה: המשתמש חסום! צריך לשחרר אותו תחילה.\n");
  }

  // צור hash חדש
  console.log("\n🔐 יוצר hash חדש לסיסמה...");
  const passwordHash = await argon2.hash(newPassword);
  
  // עדכן את הסיסמה והוסף timestamp
  const now = new Date().toISOString();
  db.prepare("UPDATE users SET passwordHash = ?, passwordChangedAt = ? WHERE email = ?")
    .run(passwordHash, now, email);
  
  console.log("✅ הסיסמה עודכנה בהצלחה!");
  console.log("\n📝 פרטי התחברות חדשים:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log("\n🔒 Session Invalidation:");
  console.log("   ✅ כל ה-sessions הישנים של המשתמש בוטלו");
  console.log("   ✅ המשתמש יידרש להתחבר מחדש עם הסיסמה החדשה");
  console.log("   ✅ אין צורך לנקות cache/cookies ידנית!\n");
  console.log("💡 המשתמש יוכל להתחבר עם הסיסמה החדשה מיידית\n");
  
} catch (error) {
  console.error("\n❌ שגיאה:", error.message);
  process.exit(1);
} finally {
  db.close();
}

