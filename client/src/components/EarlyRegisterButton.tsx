import { useState } from "react";
import { earlyRegister } from "../lib/api";

export function EarlyRegisterButton({ tournamentId, userId }: { tournamentId: number; userId: number }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await earlyRegister({ tournamentId, userId });
      if (!res.ok) throw new Error(res.error || "early-register failed");
      // הצלחה – תוכל להראות טוסט/להתקדם
      console.log("registered", res.registrationId, res.status);
    } catch (e) {
      console.error(e);
      // הצג הודעת שגיאה למשתמש
    } finally {
      setLoading(false);
    }
  };

  return (
    <button disabled={loading} onClick={onClick}>
      {loading ? "מבצע..." : "אני בפנים"}
    </button>
  );
}
