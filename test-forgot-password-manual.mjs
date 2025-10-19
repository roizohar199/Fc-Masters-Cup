#!/usr/bin/env node
/**
 * סקריפט לבדיקת forgot-password ידנית
 * 
 * שימוש:
 * node test-forgot-password-manual.mjs [email] [port]
 * 
 * דוגמאות:
 * node test-forgot-password-manual.mjs test@example.com
 * node test-forgot-password-manual.mjs test@example.com 8787
 */

const email = process.argv[2] || "test@example.com";
const port = process.argv[3] || "8787";
const baseUrl = `http://localhost:${port}`;

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 בדיקת Forgot Password ידנית");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📧 Email:", email);
console.log("🌐 Server:", baseUrl);
console.log("🕒 Time:", new Date().toISOString());
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const payload = {
  email: email
};

console.log("📤 Sending POST request...");
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
  console.log("📥 Response Received");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Status:", response.status, response.statusText);
  console.log("📋 Headers:");
  response.headers.forEach((value, key) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log();

  const data = await response.json();
  console.log("📦 Response Body:");
  console.log(JSON.stringify(data, null, 2));
  console.log();

  if (response.ok) {
    console.log("✅ Request succeeded!");
  } else {
    console.log("❌ Request failed!");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏁 Test Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

} catch (error) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💥 Request Failed");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log("💡 טיפים:");
  console.log("   - ודא שהשרת רץ על http://localhost:" + port);
  console.log("   - בדוק את משתני הסביבה (SMTP_*)");
  console.log("   - בדוק את הלוגים בשרת");
  console.log();
  
  process.exit(1);
}

