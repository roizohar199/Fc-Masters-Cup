import { useEffect, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

interface TournamentRegistrationsPanelProps {
  tournamentId: string;
}

export function TournamentRegistrationsPanel({ tournamentId }: TournamentRegistrationsPanelProps) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // זיהוי מובייל
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function load(reset = false) {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        state: "registered",
        search: q,
        limit: "50",
      });
      if (!reset && cursor) params.set("cursor", cursor);

      const result = await api(
        `/api/tournament-registrations/${tournamentId}/registrations?${params.toString()}`
      );

      if (result.ok) {
        if (reset) {
          setRows(result.items);
        } else {
          setRows((prev) => [...prev, ...result.items]);
        }
        setTotal(result.total);
        setCursor(result.nextCursor);
      } else {
        toast.error("שגיאה בטעינת רשימת הנרשמים");
      }
    } catch (error) {
      console.error("Error loading registrations:", error);
      toast.error("שגיאה בטעינת רשימת הנרשמים");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  function handleSearch() {
    setCursor(null);
    load(true);
  }

  function handleExport() {
    const exportUrl = `/api/tournament-registrations/${tournamentId}/registrations/export`;
    window.open(exportUrl, "_blank");
    toast.success("📥 מוריד קובץ CSV...");
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: isMobile ? 16 : 24,
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        padding: isMobile ? 16 : 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? 16 : 24,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? 20 : 28,
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
          }}
        >
          👥 נרשמים לטורניר ({total})
        </h3>
      </div>

      {/* Search & Export */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 16 : 20,
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="חיפוש לפי שם PSN או אימייל..."
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : 200,
            padding: isMobile ? "10px 14px" : "12px 16px",
            fontSize: isMobile ? 14 : 15,
            borderRadius: 10,
            border: "2px solid #e9ecef",
            outline: "none",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#667eea";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e9ecef";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={handleSearch}
          disabled={busy}
          style={{
            padding: isMobile ? "10px 20px" : "12px 24px",
            fontSize: isMobile ? 14 : 15,
            fontWeight: 700,
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            cursor: busy ? "not-allowed" : "pointer",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
            opacity: busy ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
            }
          }}
        >
          🔍 חפש
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: isMobile ? "10px 20px" : "12px 24px",
            fontSize: isMobile ? 14 : 15,
            fontWeight: 700,
            borderRadius: 10,
            border: "2px solid #28a745",
            background: "#fff",
            color: "#28a745",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#28a745";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#28a745";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          📥 יצוא CSV
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid #e9ecef",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: isMobile ? 16 : 20,
        }}
      >
        {isMobile ? (
          // Mobile View - Cards
          <div>
            {rows.map((r: any) => (
              <div
                key={r.id}
                style={{
                  padding: 16,
                  borderBottom: "1px solid #f0f0f0",
                  background: "#fafafa",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "#667eea" }}>👤 {r.name || "—"}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                  📧 {r.email || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  🕒 {new Date(r.createdAt).toLocaleString("he-IL")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop View - Table
          <table style={{ width: "100%", fontSize: 14 }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#495057",
                  }}
                >
                  👤 שם PSN
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#495057",
                  }}
                >
                  📧 אימייל
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#495057",
                  }}
                >
                  🕒 נרשם ב־
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, idx: number) => (
                <tr
                  key={r.id}
                  style={{
                    borderTop: idx > 0 ? "1px solid #f0f0f0" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "12px 16px", color: "#333" }}>{r.name ?? "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#666" }}>{r.email ?? "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#999" }}>
                    {new Date(r.createdAt).toLocaleString("he-IL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows.length === 0 && !busy && (
          <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
            😔 אין נרשמים עדיין
          </div>
        )}

        {busy && rows.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#999" }}>⏳ טוען...</div>
        )}
      </div>

      {/* Footer - Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: isMobile ? 12 : 13, color: "#6c757d" }}>
          מציג <strong>{rows.length}</strong> מתוך <strong>{total}</strong> נרשמים
        </span>
        <button
          disabled={!cursor || busy}
          onClick={() => load(false)}
          style={{
            padding: isMobile ? "8px 16px" : "10px 20px",
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: cursor && !busy ? "#f8f9fa" : "#e9ecef",
            color: cursor && !busy ? "#495057" : "#adb5bd",
            cursor: cursor && !busy ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (cursor && !busy) {
              e.currentTarget.style.background = "#e9ecef";
            }
          }}
          onMouseLeave={(e) => {
            if (cursor && !busy) {
              e.currentTarget.style.background = "#f8f9fa";
            }
          }}
        >
          {busy ? "⏳ טוען..." : "📄 טען עוד"}
        </button>
      </div>
    </div>
  );
}

