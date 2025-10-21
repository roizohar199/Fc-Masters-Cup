// ✅ SHIM: מונע ERR_MODULE_NOT_FOUND אם יש ייבוא ישן ל-./db/migrate
// אין מיגרציה כאן – המיגרציה רצה אינליין ב-index.ts.
// קובץ זה מבטל כל קריאה ישנה שעדיין קיימת בקבצי dist ישנים.

export function runMigrations(): void {
  // no-op - הפונקציה לא עושה כלום, רק מונעת שגיאת import
  console.log("[migrate.ts shim] נקרא no-op - המיגרציה האמיתית רצה ב-index.ts");
}

export default {};
