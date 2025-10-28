import { useState } from "react";
import { earlyRegister } from "../lib/api";

export function EarlyRegisterButton({ tournamentId, userId }: { tournamentId: number; userId: number }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await earlyRegister({ tournamentId, userId });
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
