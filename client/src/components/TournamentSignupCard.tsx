import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";

type Status = "collecting" | "closed" | "running" | "finished";
type MyState = "registered" | "cancelled" | null;

interface TournamentSignupCardProps {
  tournamentId: string;
}

export function TournamentSignupCard({ tournamentId }: TournamentSignupCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // זיהוי מובייל
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const result = await api(`/api/tournament-registrations/${tournamentId}/summary`);
      setData(result);
    } catch (error) {
      console.error("Error fetching tournament summary:", error);
      toast.error("שגיאה בטעינת נתוני הטורניר");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const t = data?.tournament as
    | { title: string; status: Status; capacity: number; min: number }
    | undefined;
  const count = data?.count ?? 0;
  const isFull = data?.isFull ?? false;
  const myState = data?.myState as MyState;

  const canJoin = t?.status === "collecting" && !isFull && myState !== "registered";
  const canLeave = t?.status === "collecting" && myState === "registered";

  async function join() {
    const tId = toast.loading("נרשם...");
    try {
      const result = await api(`/api/tournament-registrations/${tournamentId}/register`, {
        method: "POST",
      });
      toast.dismiss(tId);
      if (result.ok) {
        toast.success("✅ נרשמת בהצלחה לטורניר!");
        refresh();
      } else {
        toast.error(result.error || "שגיאה ברישום");
      }
    } catch (error) {
      toast.dismiss(tId);
      toast.error("שגיאה ברישום לטורניר");
      console.error(error);
    }
  }

  async function leave() {
    const tId = toast.loading("מבטל רישום...");
    try {
      const result = await api(`/api/tournament-registrations/${tournamentId}/unregister`, {
        method: "POST",
      });
      toast.dismiss(tId);
      if (result.ok) {
        toast.success("הרישום בוטל בהצלחה");
        refresh();
      } else {
        toast.error(result.error || "שגיאה בביטול");
      }
    } catch (error) {
      toast.dismiss(tId);
      toast.error("שגיאה בביטול הרישום");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 20,
          background: "white",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", color: "#999" }}>טוען נתוני טורניר...</div>
      </div>
    );
  }

  if (!data || !t) {
    return (
      <div
        style={{
          padding: isMobile ? 20 : 32,
          borderRadius: isMobile ? 16 : 24,
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          border: "1px solid rgba(102, 126, 234, 0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              fontSize: isMobile ? 20 : 28,
              fontWeight: 800,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 16px 0",
            }}
          >
            ⚽ רישום מוקדם לטורניר
          </h3>
          
          <div
            style={{
              padding: isMobile ? 16 : 20,
              borderRadius: 12,
              background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
              border: "2px solid #ff9800",
              marginBottom: isMobile ? 16 : 20,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? 14 : 16,
                color: "#e65100",
                fontWeight: 600,
              }}
            >
              🔄 כרגע אין טורניר פעיל להרשמה
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: isMobile ? 12 : 14,
                color: "#bf360c",
              }}
            >
              הטורניר הבא יפתח בקרוב - בדוק שוב מאוחר יותר!
            </p>
          </div>
          
          {/* הסבר על איך זה עובד גם כשאין טורניר */}
          <div
            style={{
              padding: isMobile ? 12 : 16,
              borderRadius: 12,
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              border: "2px solid #2196f3",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: isMobile ? 14 : 16,
                fontWeight: 700,
                color: "#1565c0",
                textAlign: "center",
              }}
            >
              📋 איך זה עובד?
            </h4>
            <div
              style={{
                fontSize: isMobile ? 12 : 13,
                color: "#0d47a1",
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>1️⃣ הרשמה:</strong> לחץ "אני בפנים!" כדי להירשם לטורניר
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>2️⃣ 16 הראשונים:</strong> 16 השחקנים הראשונים שירשמו ישחקו בטורניר הראשון
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>3️⃣ טורניר נוסף:</strong> אם יירשמו עוד 16 שחקנים, נפתח טורניר שני
              </p>
              <p style={{ margin: "0" }}>
                <strong>4️⃣ הודעה למנהל:</strong> המנהל יקבל מייל על כל רישום חדש
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((count / (t.capacity || 100)) * 100));

  return (
    <div
      style={{
        padding: isMobile ? 20 : 32,
        borderRadius: isMobile ? 16 : 24,
        background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? 16 : 20,
          flexWrap: "wrap",
          gap: 12,
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
          ⚽ {t.title || "טורניר שישי בערב"}
        </h3>
        <span
          style={{
            fontSize: isMobile ? 16 : 18,
            fontWeight: 700,
            color: isFull ? "#e74c3c" : "#27ae60",
            padding: "8px 16px",
            borderRadius: 20,
            background: isFull ? "#ffe0e0" : "#e8f8f0",
          }}
        >
          {count}/{t.capacity ?? 100} נרשמו
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          height: isMobile ? 12 : 16,
          background: "#e9ecef",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: isMobile ? 16 : 20,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: isFull
              ? "linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)"
              : "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            width: `${pct}%`,
            transition: "width 0.5s ease-in-out",
            borderRadius: 20,
          }}
        />
      </div>

      {/* Status Messages */}
      {myState === "registered" && (
        <div
          style={{
            padding: isMobile ? 12 : 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
            border: "2px solid #28a745",
            marginBottom: isMobile ? 16 : 20,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? 15 : 17,
              fontWeight: 700,
              color: "#155724",
            }}
          >
            ✅ אתה רשום לטורניר זה!
          </p>
        </div>
      )}

      {isFull && myState !== "registered" && (
        <div
          style={{
            padding: isMobile ? 12 : 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #ffe0e0 0%, #ffc9c9 100%)",
            border: "2px solid #e74c3c",
            marginBottom: isMobile ? 16 : 20,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? 15 : 17,
              fontWeight: 700,
              color: "#c0392b",
            }}
          >
            😢 הטורניר מלא - אין מקומות פנויים
          </p>
        </div>
      )}

      {/* Description */}
      <div
        style={{
          marginBottom: isMobile ? 16 : 20,
        }}
      >
        <p
          style={{
            fontSize: isMobile ? 14 : 16,
            color: "#555",
            lineHeight: 1.8,
            marginBottom: isMobile ? 12 : 16,
            textAlign: "center",
          }}
        >
          מחכים ל־<strong>{t.min ?? 16}+</strong> נרשמים (עד מקס׳ <strong>{t.capacity ?? 100}</strong>
          ). התשלום ייגבה בקבוצת הטלגרם בביט, ותונפק קבלה.
        </p>
        
        {/* הסבר על איך זה עובד */}
        <div
          style={{
            padding: isMobile ? 12 : 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            border: "2px solid #2196f3",
            marginBottom: isMobile ? 12 : 16,
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: "#1565c0",
              textAlign: "center",
            }}
          >
            📋 איך זה עובד?
          </h4>
          <div
            style={{
              fontSize: isMobile ? 12 : 13,
              color: "#0d47a1",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>1️⃣ הרשמה:</strong> לחץ "אני בפנים!" כדי להירשם לטורניר
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>2️⃣ 16 הראשונים:</strong> 16 השחקנים הראשונים שירשמו ישחקו בטורניר הראשון
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>3️⃣ טורניר נוסף:</strong> אם יירשמו עוד 16 שחקנים, נפתח טורניר שני
            </p>
            <p style={{ margin: "0" }}>
              <strong>4️⃣ הודעה למנהל:</strong> המנהל יקבל מייל על כל רישום חדש
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? 8 : 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={join}
          disabled={!canJoin}
          style={{
            padding: isMobile ? "12px 24px" : "16px 40px",
            borderRadius: 12,
            fontSize: isMobile ? 15 : 18,
            fontWeight: 700,
            border: "none",
            cursor: canJoin ? "pointer" : "not-allowed",
            background: canJoin
              ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
              : "#e9ecef",
            color: canJoin ? "#fff" : "#adb5bd",
            boxShadow: canJoin ? "0 4px 15px rgba(40, 167, 69, 0.4)" : "none",
            transition: "all 0.3s ease",
            flex: isMobile ? "1 1 45%" : "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if (canJoin) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(40, 167, 69, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (canJoin) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(40, 167, 69, 0.4)";
            }
          }}
        >
          🎮 אני בפנים!
        </button>
        <button
          onClick={leave}
          disabled={!canLeave}
          style={{
            padding: isMobile ? "12px 24px" : "16px 40px",
            borderRadius: 12,
            fontSize: isMobile ? 15 : 18,
            fontWeight: 700,
            cursor: canLeave ? "pointer" : "not-allowed",
            background: canLeave ? "#fff" : "#f8f9fa",
            color: canLeave ? "#e74c3c" : "#adb5bd",
            border: canLeave ? "2px solid #e74c3c" : "2px solid #dee2e6",
            boxShadow: canLeave ? "0 2px 8px rgba(231, 76, 60, 0.2)" : "none",
            transition: "all 0.3s ease",
            flex: isMobile ? "1 1 45%" : "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if (canLeave) {
              e.currentTarget.style.background = "#ffe0e0";
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            if (canLeave) {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          ❌ בטל רישום
        </button>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: isMobile ? 16 : 24,
          padding: isMobile ? 12 : 16,
          borderRadius: 12,
          background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
          border: "1px solid #ff9800",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: isMobile ? 12 : 13,
            color: "#e65100",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          <strong>💰 דמי השתתפות:</strong> 50 ₪ | <strong>🏆 פרס ראשון:</strong> 500 ₪ |{" "}
          <strong>🎁 פרס שני:</strong> כניסה חינם לטורניר הבא
          <br />
          <span style={{ fontSize: isMobile ? 11 : 12, color: "#bf360c" }}>
            (התשלום <strong>לא</strong> מתבצע באתר - יגבה בקבוצת טלגרם)
          </span>
        </p>
      </div>
    </div>
  );
}

