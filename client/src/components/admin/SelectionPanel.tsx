import React, { useState } from "react";

type Stage = "R16" | "QF" | "SF" | "F";

export default function SelectionPanel({ tournamentId }: { tournamentId: number }) {
  const [stage, setStage] = useState<Stage>("R16");
  const [slots, setSlots] = useState<number>(16);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyHomepage, setNotifyHomepage] = useState(true);

  const defaultSlots = (s: Stage) => (s === "R16" ? 16 : s === "QF" ? 8 : s === "SF" ? 4 : 2);

  const onStageChange = (s: Stage) => {
    setStage(s);
    setSlots(defaultSlots(s));
  };

  async function runSelection() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, slots, notifyEmail, notifyHomepage }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e: any) {
      setResult({ error: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl shadow-md border">
      <h2 className="text-xl font-semibold mb-3">בחירת שחקנים לטורניר</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm mb-1">שלב</span>
          <select className="border rounded-lg p-2" value={stage} onChange={(e) => onStageChange(e.target.value as Stage)}>
            <option value="R16">שמינית גמר (16)</option>
            <option value="QF">רבע גמר (8)</option>
            <option value="SF">חצי גמר (4)</option>
            <option value="F">גמר (2)</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm mb-1">מספר שחקנים</span>
          <input type="number" className="border rounded-lg p-2" value={slots} onChange={(e) => setSlots(Number(e.target.value))} min={1} />
        </label>
      </div>

      <div className="flex items-center gap-6 mt-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} />
          שליחת מייל לנבחרים
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={notifyHomepage} onChange={e => setNotifyHomepage(e.target.checked)} />
          יצירת התראה בעמוד הבית
        </label>
      </div>

      <button className="mt-4 px-4 py-2 rounded-xl border shadow active:scale-[0.99] disabled:opacity-50" onClick={runSelection} disabled={loading}>
        {loading ? "מבצע בחירה..." : "בחר שחקנים"}
      </button>

      {result && (
        <div className="mt-4">
          {result.error ? (
            <div className="text-red-600">שגיאה: {result.error}</div>
          ) : (
            <div>
              <div className="font-medium mb-2">נבחרו ({result.stage}):</div>
              <ul className="list-disc ms-6">
                {result.selected?.map((p: any) => (
                  <li key={p.userId}>{p.displayName} ({p.email})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
