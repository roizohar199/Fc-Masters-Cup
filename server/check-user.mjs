import Database from "better-sqlite3";

const email = process.argv[2] || "yosiyoviv@gmail.com";
const db = new Database("./tournaments.sqlite");

try {
  const user = db.prepare(`
    SELECT id, email, role, status, psnUsername, createdAt, approvalStatus, isSuperAdmin, secondPrizeCredit
    FROM users 
    WHERE email = ?
  `).get(email);

  if (user) {
    console.log("\n✅ המשתמש קיים במערכת:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`📊 Status: ${user.status}`);
    console.log(`🎮 PSN: ${user.psnUsername || 'לא הוגדר'}`);
    console.log(`💰 זיכוי: ${user.secondPrizeCredit || 0} ₪`);
    console.log(`✅ אישור: ${user.approvalStatus || 'approved'}`);
    console.log(`👑 Super Admin: ${user.isSuperAdmin ? 'כן' : 'לא'}`);
    console.log(`📅 נוצר: ${user.createdAt}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("\n❌ המשתמש לא נמצא במערכת");
    console.log(`📧 Email שחיפשת: ${email}\n`);
  }
} catch (error) {
  console.error("❌ שגיאה:", error.message);
} finally {
  db.close();
}

