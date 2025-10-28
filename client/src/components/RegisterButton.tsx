import { useState } from "react";
import { earlyRegister } from "../lib/api";

export function RegisterButton({ tournamentId, userId }: { tournamentId: number; userId: number }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const data = await earlyRegister({ tournamentId, userId });
      if (data.ok) {
        if (data.updated) setMsg("כבר נרשמת לטורניר ✔");
        else setMsg("נרשמת בהצלחה ✔");
      } else {
        throw new Error(data.error || "שגיאה בהרשמה");
      }
    } catch (e: any) {
      setMsg(e?.message || "שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1, pointerEvents: loading ? "none" : "auto" }}
      >
        {loading ? "שולח..." : "אני בפנים"}
      </button>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
