// client/src/components/JoinButton.tsx
import { useState } from "react";
import { postJSON } from "../lib/api";

type JoinResponse = {
  ok: boolean;
  already?: boolean;
  registrationId?: string;
  status?: string;
  error?: string;
};

export default function JoinButton({
  tournamentId,
  userId,
}: {
  tournamentId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const data = await postJSON<JoinResponse>("/api/early-register", {
        tournamentId,
        userId,
      });

      if (data.ok) {
        setMsg(
          data.already
            ? "כבר נרשמת לטורניר."
            : "נרשמת בהצלחה! נעדכן אותך במייל."
        );
      } else {
        setMsg(data.error || "שגיאה בהרשמה");
      }
    } catch (e: any) {
      setMsg(e?.message || "שגיאה בתקשורת לשרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? "שולח..." : "אני בפנים"}
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </button>
  );
}
