import { useState } from "react";
import { earlyRegister } from "../lib/api";

export function EarlyRegisterButton({ tournamentId }: { tournamentId?: string | number }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      // ✅ userId לא נשלח - מגיע אוטומטית מה-cookie session
      // ✅ tournamentId אופציונלי - אם חסר, השרת יפתור אוטומטית (טורניר פתוח/אחרון)
      const payload: { tournamentId?: string | number } = {};
      if (tournamentId) {
        payload.tournamentId = tournamentId;
      }
      const res = await earlyRegister(payload);
      if (!res.ok) throw new Error(res?.error || "early-register failed");
      // success UX...
      console.log("registered", res.registrationId, res.status);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={onClick} disabled={loading}>
        {loading ? "שולח..." : "אני בפנים"}
      </button>
      {err && <div className="text-red-500 text-sm mt-1">{err}</div>}
    </>
  );
}
