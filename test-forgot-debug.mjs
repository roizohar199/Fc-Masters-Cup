#!/usr/bin/env node
/**
 * בדיקה מפורטת של forgot-password עם debug מלא
 */

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 בדיקת Forgot Password - Debug Mode");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const email = process.argv[2] || "roizohar111@gmail.com";
const port = process.argv[3] || "8787";
const baseUrl = `http://localhost:${port}`;

console.log("📧 Email:", email);
console.log("🌐 Server:", baseUrl);
console.log("🕒 Time:", new Date().toISOString());
console.log();

const payload = { email };

console.log("📤 Sending POST to /api/auth/forgot-password...");
console.log("📋 Payload:", JSON.stringify(payload, null, 2));
console.log();

try {
  const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📥 Response");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Status:", response.status, response.statusText);
  
  const data = await response.json();
  console.log("Body:", JSON.stringify(data, null, 2));
  console.log();

  if (response.ok) {
    console.log("✅ Request OK");
    console.log();
    console.log("💡 עכשיו תבדוק:");
    console.log("   1. בדוק את הקונסול של השרת - צריך לראות לוגים מפורטים");
    console.log("   2. חפש בלוגים:");
    console.log("      🔑 FORGOT PASSWORD REQUEST START");
    console.log("      📧 Sending password reset email...");
    console.log("      ✅ Email sent successfully!");
    console.log("   3. בדוק את המייל: " + email);
    console.log("   4. בדוק גם Spam/Junk");
    console.log();
    console.log("⏱️  זמן משוער: 5-30 שניות");
  } else {
    console.log("❌ Request failed!");
  }

} catch (error) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💥 Error");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error(error.message);
  console.log();
  console.log("💡 האם השרת רץ? נסה:");
  console.log("   cd server && npm start");
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

