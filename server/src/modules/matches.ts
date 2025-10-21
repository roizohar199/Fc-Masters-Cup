// ✅ טיפוס אחיד לסטטוס משחק – ללא שדה warning שמפוצץ טיפוסים
export type MatchStatusValue = "PENDING" | "CONFIRMED" | "DISPUTED" | "WARNING";
export type MatchStatus = Readonly<{
  status: MatchStatusValue;
  reason?: string;
}>;

// דוגמה למתאם שניהל בעבר שדה warning – נסיר גישה ל-.warning ונשתמש ב-status בלבד
export function normalizeStatus(input: any): MatchStatus {
  // אם בעבר הגיע אובייקט עם 'warning: true' – נמפה לסטטוס WARNING
  const hasLegacyWarning = typeof input?.warning !== "undefined" && !!input.warning;
  if (hasLegacyWarning) {
    return { status: "WARNING", reason: input?.reason ?? "warning" } as const;
  }

  // מיפוי ערכים קיימים
  const s = String(input?.status || "").toUpperCase();
  if (s === "CONFIRMED") return { status: "CONFIRMED", reason: input?.reason } as const;
  if (s === "DISPUTED")  return { status: "DISPUTED",  reason: input?.reason } as const;
  if (s === "WARNING")   return { status: "WARNING",   reason: input?.reason } as const;

  // ברירת מחדל
  return { status: "PENDING", reason: input?.reason } as const;
}

// דוגמה לפונקציה שקוראת הסטטוס בבטחה (ללא .warning)
export function isActionBlocked(status: MatchStatus): boolean {
  // חסום פעולה אם DISPUTED או WARNING
  return status.status === "DISPUTED" || status.status === "WARNING";
}

/**
 * אם יש לך בכל הקוד שימושים כמו:
 *   if (match.status.warning) { ... }
 * יש להחליף ל:
 *   if (match.status.status === "WARNING") { ... }
 *
 * ואם יש טיפוסים משולבים מהעבר:
 *   { readonly status: "PENDING" | "CONFIRMED" | "DISPUTED"; readonly reason?: string; }
 * החלף ל-MatchStatus המוגדר כאן.
 */

