/**
 * Test Login API
 * בודק התחברות דרך ה-API בלי צורך בדפדפן
 */

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("\n❌ שימוש: node test-login-api.mjs <email> <password>");
  console.log("דוגמה: node test-login-api.mjs yosiyoviv@gmail.com Yosi1234\n");
  process.exit(1);
}

console.log("\n🔐 בודק התחברות דרך API:");
console.log(`   Email: ${email}`);
console.log(`   Password: ${password}`);
console.log(`   URL: http://localhost:8787/api/auth/login\n`);

try {
  const response = await fetch("http://localhost:8787/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (response.ok) {
    console.log("✅ התחברות הצליחה!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email: ${data.email}`);
    console.log(`👤 Role: ${data.role}`);
    console.log(`💰 Credit: ${data.secondPrizeCredit || 0} ₪`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("❌ התחברות נכשלה!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Status: ${response.status}`);
    console.log(`Error: ${data.error || JSON.stringify(data)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
} catch (error) {
  console.error("\n❌ שגיאה בחיבור לשרת:");
  console.error(error.message);
  console.log("\n💡 וודא שהשרת רץ על http://localhost:8787\n");
  process.exit(1);
}

