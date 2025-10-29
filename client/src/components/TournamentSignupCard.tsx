import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { earlyRegister, getEarlyRegisterStatus, cancelEarlyRegister } from "../lib/api";

type Status = "collecting" | "closed" | "running" | "finished";
type MyState = "registered" | "cancelled" | "selected" | null;

interface TournamentSignupCardProps {
  tournamentId: string;
}

export function TournamentSignupCard({ tournamentId }: TournamentSignupCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [hasInterest, setHasInterest] = useState(false); // ✅ סטטוס הבעת עניין (כללי, לא טורניר ספציפי)
  const [totalInterests, setTotalInterests] = useState(0); // ✅ מספר כולל של מביעי עניין
  const [loadingInterest, setLoadingInterest] = useState(false);
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

  // ✅ טעינת סטטוס הבעת עניין (כללי, לא טורניר ספציפי)
  async function refreshInterestStatus() {
    try {
      const status = await getEarlyRegisterStatus();
      if (status.ok) {
        setHasInterest(status.hasInterest);
        setTotalInterests(status.totalCount); // ✅ מעדכן את הספירה הכוללת
      }
    } catch (error) {
      console.error("Error fetching interest status:", error);
    }
  }

  useEffect(() => {
    refresh();
    refreshInterestStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const t = data?.tournament as
    | { title: string; status: Status; capacity: number; min: number }
    | undefined;
  const count = data?.count ?? 0;
  const isFull = data?.isFull ?? false;
  const myState = data?.myState as MyState;

  // ✅ מערכת הבעת עניין כללית - תמיד פעילה (לא קשורה לטורניר ספציפי)
  // הכפתור "אני בפנים" disabled אם כבר הביע עניין או בטעינה
  const canJoinEarly = !hasInterest && !loadingInterest;
  // הכפתור "בטל רישום" enabled רק אם כבר הביע עניין
  const canLeaveEarly = hasInterest && !loadingInterest;
  
  // המערכת הישנה - רק כשהטורניר פעיל (לשימור תאימות)
  const canJoin = t?.status === "collecting" && !isFull && myState !== "registered" && myState !== "selected";
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

  async function joinEarly() {
    if (loadingInterest || hasInterest) return;
    setLoadingInterest(true);
    const tId = toast.loading("מביע עניין...");
    try {
      // ✅ הבעת עניין כללית - לא צריך tournamentId!
      const result = await earlyRegister({});
      toast.dismiss(tId);
      if (result.ok) {
        toast.success("✅ הוספת את עצמך לרשימת המעוניינים בטורניר!");
        setHasInterest(true); // ✅ מעדכן מיד את הסטטוס
        // ✅ עדכון אופטימי של הספירה (מוסיף 1)
        setTotalInterests(prev => prev + 1);
        refreshInterestStatus(); // רענון מידע מדויק מהשרת
      } else {
        toast.error(result.error || "שגיאה בהבעת עניין");
      }
    } catch (error) {
      toast.dismiss(tId);
      toast.error("שגיאה בהבעת עניין");
      console.error(error);
    } finally {
      setLoadingInterest(false);
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

  async function leaveEarly() {
    if (loadingInterest || !hasInterest) return;
    setLoadingInterest(true);
    const tId = toast.loading("מסיר עניין...");
    try {
      // ✅ ביטול הבעת עניין כללית
      const result = await cancelEarlyRegister();
      toast.dismiss(tId);
      if (result.ok) {
        toast.success("הסרת את עצמך מרשימת המעוניינים בטורניר");
        setHasInterest(false); // ✅ מעדכן מיד את הסטטוס
        // ✅ עדכון אופטימי של הספירה (מוריד 1)
        setTotalInterests(prev => Math.max(0, prev - 1));
        refreshInterestStatus(); // רענון מידע מדויק מהשרת
      } else {
        toast.error(result.error || "שגיאה בהסרת עניין");
      }
    } catch (error) {
      toast.dismiss(tId);
      toast.error("שגיאה בהסרת עניין");
      console.error(error);
    } finally {
      setLoadingInterest(false);
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
              נפתח טורניר חדש בקרוב - בדוק שוב מאוחר יותר!
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
                <strong>1️⃣ הבעת עניין:</strong> לחץ "אני בפנים!" כדי להביע עניין בטורניר
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>2️⃣ 16 הראשונים:</strong> 16 השחקנים הראשונים יזכו לשחק בטורניר הראשון
              </p>
              <p style={{ margin: "0 0 6px 0" }}>
                <strong>3️⃣ טורניר נוסף:</strong> אם יביעו עניין עוד 16 שחקנים, נפתח טורניר שני
              </p>
              <p style={{ margin: "0" }}>
                <strong>4️⃣ הודעה למנהל:</strong> המנהל יקבל מייל על כל שחקן שמביע עניין
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ חישוב אחוז לפי מספר המביעי עניין (מקסימום 16)
  const pct = Math.min(100, Math.round((totalInterests / 16) * 100));

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
          🎮 הבעת עניין בטורניר
        </h3>
        <span
          style={{
            fontSize: isMobile ? 16 : 18,
            fontWeight: 700,
            color: totalInterests >= 16 ? "#27ae60" : totalInterests >= 10 ? "#ff9800" : "#667eea",
            padding: "8px 16px",
            borderRadius: 20,
            background: totalInterests >= 16 ? "#e8f8f0" : totalInterests >= 10 ? "#fff3e0" : "#e3f2fd",
          }}
        >
          {totalInterests}/16 מביעים עניין {/* ✅ מציג את מספר הבעות העניין הכלליות */}
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
            background: totalInterests >= 16
              ? "linear-gradient(90deg, #27ae60 0%, #20c997 100%)"
              : totalInterests >= 10
              ? "linear-gradient(90deg, #ff9800 0%, #f57c00 100%)"
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
            ✅ אתה מביע עניין בטורניר!
          </p>
        </div>
      )}

      {myState === "selected" && (
        <div
          style={{
            padding: isMobile ? 12 : 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
            border: "2px solid #ffc107",
            marginBottom: isMobile ? 16 : 20,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? 15 : 17,
              fontWeight: 700,
              color: "#ff6f00",
            }}
          >
            🎉 נבחרת לטורניר! מחכים לראות אותך על המגרש! 🏆
          </p>
        </div>
      )}

      {isFull && myState !== "registered" && myState !== "selected" && (
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
            😢 הגענו למקסימום שחקנים שמביעים עניין
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
          מחכים ל־<strong>{t.min ?? 16}+</strong> שחקנים שמביעים עניין (עד מקס׳ <strong>{t.capacity ?? 100}</strong>
          ). לאחר מכן נפתח טורניר והתשלום ייגבה בקבוצת הטלגרם בביט.
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
              <strong>1️⃣ הבעת עניין:</strong> לחץ "אני בפנים!" כדי להביע עניין בטורניר
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>2️⃣ 16 הראשונים:</strong> 16 השחקנים הראשונים יזכו לשחק בטורניר הראשון
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>3️⃣ טורניר נוסף:</strong> אם יביעו עניין עוד 16 שחקנים, נפתח טורניר שני
            </p>
            <p style={{ margin: "0" }}>
              <strong>4️⃣ הודעה למנהל:</strong> המנהל יקבל מייל על כל שחקן שמביע עניין
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
          onClick={canJoinEarly ? joinEarly : canJoin ? join : undefined}
          disabled={!canJoinEarly && !canJoin || loadingInterest}
          style={{
            padding: isMobile ? "12px 24px" : "16px 40px",
            borderRadius: 12,
            fontSize: isMobile ? 15 : 18,
            fontWeight: 700,
            border: "none",
            cursor: (canJoinEarly || canJoin) && !loadingInterest ? "pointer" : "not-allowed",
            background: (canJoinEarly || canJoin) && !loadingInterest
              ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
              : "#e9ecef",
            color: (canJoinEarly || canJoin) && !loadingInterest ? "#fff" : "#adb5bd",
            boxShadow: (canJoinEarly || canJoin) && !loadingInterest ? "0 4px 15px rgba(40, 167, 69, 0.4)" : "none",
            opacity: loadingInterest ? 0.6 : 1,
            transition: "all 0.3s ease",
            flex: isMobile ? "1 1 45%" : "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if ((canJoinEarly || canJoin) && !loadingInterest) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(40, 167, 69, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if ((canJoinEarly || canJoin) && !loadingInterest) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(40, 167, 69, 0.4)";
            }
          }}
        >
          {loadingInterest ? "⏳ שולח..." : "🎮 אני בפנים!"}
        </button>
        <button
          onClick={canLeaveEarly ? leaveEarly : canLeave ? leave : undefined}
          disabled={!canLeaveEarly && !canLeave || loadingInterest}
          style={{
            padding: isMobile ? "12px 24px" : "16px 40px",
            borderRadius: 12,
            fontSize: isMobile ? 15 : 18,
            fontWeight: 700,
            cursor: (canLeaveEarly || canLeave) && !loadingInterest ? "pointer" : "not-allowed",
            background: (canLeaveEarly || canLeave) && !loadingInterest ? "#fff" : "#f8f9fa",
            color: (canLeaveEarly || canLeave) && !loadingInterest ? "#e74c3c" : "#adb5bd",
            border: (canLeaveEarly || canLeave) && !loadingInterest ? "2px solid #e74c3c" : "2px solid #dee2e6",
            boxShadow: (canLeaveEarly || canLeave) && !loadingInterest ? "0 2px 8px rgba(231, 76, 60, 0.2)" : "none",
            opacity: loadingInterest ? 0.6 : 1,
            transition: "all 0.3s ease",
            flex: isMobile ? "1 1 45%" : "0 0 auto",
          }}
          onMouseEnter={(e) => {
            if ((canLeaveEarly || canLeave) && !loadingInterest) {
              e.currentTarget.style.background = "#ffe0e0";
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            if ((canLeaveEarly || canLeave) && !loadingInterest) {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {loadingInterest ? "⏳ מבטל..." : "❌ בטל רישום"}
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
          <strong>💰 דמי השתתפות:</strong> 50 ₪ | <strong>🏆 פרס ראשון:</strong> 500 ₪
          <br />
          <span style={{ fontSize: isMobile ? 11 : 12, color: "#bf360c" }}>
            (התשלום <strong>לא</strong> מתבצע באתר - יגבה בקבוצת טלגרם)
          </span>
        </p>
      </div>
    </div>
  );
}

