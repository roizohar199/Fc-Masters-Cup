import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJSON } from "../../utils/fetchJSON";
import { colors, buttonStyles, shadows } from "../../styles";

// טיפוס המשתמש המותאם ל-API הקיים
type User = { 
  id: string; 
  email: string; 
  psnUsername?: string; 
  role: string;
  status?: string; 
  approvalStatus?: string;
};

// ===== Utils פשוטים =====
function uniqueNumeric(ids: any[]): string[] {
  return Array.from(new Set((ids || []).map(String).filter(Boolean)));
}
// ===== סוף תוספת =====

// טעינת משתמשים מה-API הקיים
async function loadUsers(): Promise<User[]> {
  console.log("🔄 Loading users from existing API...");
  try {
    const data = await fetchJSON<User[]>("/api/admin/users");
    console.log("✅ API response:", data?.length, "users loaded");
    
    // סינון משתמשים פעילים ומאושרים בלבד (מחוברים ולא מחוברים)
    const activeUsers = data.filter(u => 
      u.status === 'active' && 
      (u.approvalStatus === 'approved' || !u.approvalStatus) &&
      u.role === 'player' // רק שחקנים, לא מנהלים
    );
    
    console.log("✅ Active players:", activeUsers.length);
    return activeUsers;
  } catch (error) {
    console.error("❌ Failed to load users:", error);
    return [];
  }
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: colors.background.gradient,
  padding: "24px",
};

const mainContentStyle: React.CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 800,
  color: colors.neutral.white,
  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: shadows.lg,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "2px solid #e0e0e0",
  fontSize: "15px",
  transition: "all 0.3s ease",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: "8px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  fontSize: "12px",
  borderRadius: "20px",
  fontWeight: 600,
};

const userCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

export default function ManualBracketManager() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  const [name, setName] = useState("FC Cup – טורניר שישי");
  const [game, setGame] = useState("FC25");
  const [startsAt, setStartsAt] = useState<string>(() => new Date(Date.now()+3600_000*4).toISOString().slice(0,16));
  const [sendEmails, setSendEmails] = useState(true);

  const [tid, setTid] = useState<number|null>(null);
  const [R16,setR16] = useState<string[]>([]);
  const [QF,setQF]   = useState<string[]>([]);
  const [SF,setSF]   = useState<string[]>([]);
  const [F,setF]     = useState<string[]>([]);

  useEffect(()=>{ loadUsers().then(setUsers).catch(e=>alert("שגיאה בטעינת משתמשים: "+e.message)); },[]);

  const filtered = useMemo(()=>{
    const q=query.trim().toLowerCase(); if(!q) return users;
    return users.filter(u =>
      (u.email||"").toLowerCase().includes(q) ||
      (u.psnUsername||"").toLowerCase().includes(q)
    );
  },[users,query]);

  const toggle = (arr:string[], setter:(x:string[])=>void, id:string, max:number) => {
    setter(arr.includes(id) ? arr.filter(x=>x!==id) : (arr.length<max ? [...arr,id] : arr));
  };

  async function createTournament() {
    const seeds16 = uniqueNumeric(R16);
    console.log("🔍 Debug createTournament:");
    console.log("  - R16 state:", R16);
    console.log("  - seeds16 processed:", seeds16);
    console.log("  - seeds16.length:", seeds16.length);
    
    if (seeds16.length !== 16) {
      alert(`צריך לבחור בדיוק 16 שחקנים ייחודיים. לאחר איחוד התקבלו ${seeds16.length}.`);
      return;
    }

    try {
      const payload = {
        name,
        game,
        startsAt: new Date(startsAt).toISOString(),
        seeds16,            // <-- מזהי משתמשים
        sendEmails,
      };
      
      console.log("📤 Sending payload:", payload);

      const res = await fetchJSON<{ ok: boolean; tournamentId?: number; error?: string; reason?: string }>(
        "/api/admin/tournaments/create",
        { 
          method: "POST", 
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log("📥 Server response:", res);

      if (!res.ok) {
        alert(`שגיאה ביצירה: ${res.error || res.reason || "unknown"}`);
        return;
      }
      setTid(res.tournamentId!);
      alert(`טורניר נוצר (#${res.tournamentId})`);
    } catch (e: any) {
      console.error("❌ Tournament creation error:", e);
      alert("שגיאה ביצירת טורניר: " + (e?.message || e));
    }
  }

  // הוסר - פונקציית שמירת שלבים לא רלוונטית למבנה הפשוט

  async function advanceStage(stage: "QF"|"SF"|"F", requiredCount: number, stageName: string) {
    const selected = {QF,SF,F}[stage];
    const selectedIds = uniqueNumeric(selected);
    
    if (selectedIds.length !== requiredCount) {
      alert(`צריך לבחור בדיוק ${requiredCount} שחקנים ל${stageName}. נבחרו ${selectedIds.length}.`);
      return;
    }

    if (!tid) {
      alert("אין טורניר פעיל. צור טורניר תחילה.");
      return;
    }

    if (sendEmails) {
      const confirmed = confirm(`האם להעלות ${requiredCount} שחקנים ל${stageName}? ההתראות והמיילים יישלחו אוטומטית.`);
      if (!confirmed) return;
    }

    try {
      const response = await fetchJSON<{ ok: boolean; message?: string }>(
        `/api/admin/advance-stage`,
        {
          method: "POST",
          body: JSON.stringify({
            tournamentId: tid,
            stage,
            selectedIds,
            sendEmails
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        alert(`❌ שגיאה: ${response.message || 'unknown error'}`);
        return;
      }

      alert(`✅ ${requiredCount} שחקנים הועלו לשלב ${stageName}! מיילים נשלחו.`);
    } catch (e: any) {
      console.error(`❌ Error advancing to ${stage}:`, e);
      alert(`שגיאה: ${e?.message || e}`);
    }
  }

  const getBadgeColor = (stage: "R16"|"QF"|"SF"|"F") => {
    const stageColors = {
      R16: { bg: colors.stages.r16.light, color: colors.stages.r16.border },
      QF: { bg: colors.stages.qf.light, color: colors.stages.qf.border },
      SF: { bg: colors.stages.sf.light, color: colors.stages.sf.border },
      F: { bg: colors.stages.final.light, color: colors.stages.final.border },
    };
    return stageColors[stage];
  };

  const Card = (u: User) => (
    <div key={u.id} style={userCardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontWeight: 600, color: colors.text.primary }}>
          {u.psnUsername || u.email}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <span style={{ ...badgeStyle, background: colors.neutral.gray200, color: colors.text.secondary }}>
            {u.role}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "12px", color: colors.text.secondary, marginBottom: "12px" }}>
        PSN: {u.psnUsername || '-'} | Email: {u.email} | Status: {u.status || 'active'}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {(["R16", "QF", "SF", "F"] as const).map(stage => {
          const isSelected = {R16,QF,SF,F}[stage].includes(u.id);
          const stageColor = getBadgeColor(stage);
          return (
            <button
              key={stage}
              style={{
                ...buttonStyles.small,
                background: isSelected ? stageColor.color : colors.neutral.gray200,
                color: isSelected ? colors.neutral.white : colors.text.primary,
                boxShadow: isSelected ? `0 2px 8px ${stageColor.bg}` : "none",
              }}
              onClick={()=>toggle({R16,QF,SF,F}[stage], {R16:setR16,QF:setQF,SF:setSF,F:setF}[stage], u.id, {R16:16,QF:8,SF:4,F:2}[stage])}
            >
              {stage === "R16" ? "שמינית" : stage === "QF" ? "רבע" : stage === "SF" ? "חצי" : "גמר"}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={mainContentStyle}>
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={() => navigate("/")}
              style={{
                ...buttonStyles.secondary,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontSize: "16px",
              }}
              title="חזרה לדף הבית"
            >
              🏠 דף הבית
            </button>
            <h1 style={titleStyle}>יצירת טורניר + שיוך ידני</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {(["R16", "QF", "SF", "F"] as const).map(stage => {
              const count = {R16,QF,SF,F}[stage].length;
              const max = {R16:16,QF:8,SF:4,F:2}[stage];
              const stageColor = getBadgeColor(stage);
              const isComplete = count === max;
              const stageNames = {R16: "שמינית", QF: "רבע", SF: "חצי", F: "גמר"};
              
              return (
                <div key={stage} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span 
                    style={{ 
                      ...badgeStyle, 
                      background: isComplete ? stageColor.color : colors.neutral.gray200,
                      color: isComplete ? colors.neutral.white : colors.text.primary 
                    }}
                  >
                    {stageNames[stage]} {count}/{max}
                  </span>
                  {stage !== "R16" && isComplete && (
                    <button 
                      onClick={() => advanceStage(stage as "QF"|"SF"|"F", max, stageNames[stage])}
                      style={{
                        ...buttonStyles.small,
                        background: stageColor.color,
                        color: colors.neutral.white,
                        fontSize: "12px",
                        padding: "4px 12px"
                      }}
                    >
                      העבר לשלב
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </header>

        <section style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>שם</label>
              <input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>משחק</label>
              <select style={selectStyle} value={game} onChange={e=>setGame(e.target.value)}>
                <option>FC25</option><option>FC26</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>תאריך/שעה</label>
              <input type="datetime-local" style={inputStyle} value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "28px" }}>
              <input id="mail" type="checkbox" checked={sendEmails} onChange={e=>setSendEmails(e.target.checked)} />
              <label htmlFor="mail" style={{ fontSize: "14px", color: colors.text.primary }}>שליחת מייל לנבחרים</label>
            </div>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button onClick={createTournament} style={{...buttonStyles.primary, width: "100%"}}>צור טורניר</button>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <input 
            placeholder="חפש מייל או PSN…" 
            style={inputStyle} 
            value={query} 
            onChange={e=>setQuery(e.target.value)} 
          />
          <div style={{ marginTop: "8px", fontSize: "12px", color: colors.text.secondary }}>
            מציג את כל המשתמשים הרשומים באתר ({users.length} משתמשים)
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map(Card)}
        </section>

        <footer style={{ 
          position: "sticky", 
          bottom: "16px", 
          background: "rgba(255, 255, 255, 0.95)", 
          borderRadius: "16px", 
          padding: "16px", 
          boxShadow: shadows.lg,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <div style={{ fontSize: "14px", color: colors.text.secondary, textAlign: "center" }}>
              💡 יצירת הטורניר תשמור אוטומטית את השחקנים הנבחרים, מנהלים נא לשים לב שמשתתף שאתם בוחרים אכן שילם ושלח אישור תשלום.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
