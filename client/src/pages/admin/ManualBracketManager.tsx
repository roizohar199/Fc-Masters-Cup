import React, { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "../../utils/fetchJSON";
import { colors, buttonStyles, shadows } from "../../styles";

type User = { 
  id: number; 
  email: string; 
  psnUsername?: string;
  role?: string;
  isOnline?: boolean;
  approvalStatus?: string;
};

// ===== הוספה למעלה בקובץ =====
function uniqueNumeric(ids: any[]): number[] {
  return Array.from(
    new Set(
      (ids || []).map((x) => Number(x)).filter((n) => Number.isFinite(n))
    )
  );
}
function idsDiff(a: number[], b: number[]): number[] {
  const sb = new Set(b);
  return a.filter((x) => !sb.has(x));
}
// ===== סוף תוספת =====

// טוען את כל המשתמשים הרשומים מה-API של האדמין
async function loadUsers(): Promise<User[]> {
  const data = await fetchJSON<User[]>("/api/admin/users");
  return data || [];
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
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  const [name, setName] = useState("FC Cup – טורניר שישי");
  const [game, setGame] = useState("FC25");
  const [startsAt, setStartsAt] = useState<string>(() => new Date(Date.now()+3600_000*4).toISOString().slice(0,16));
  const [sendEmails, setSendEmails] = useState(true);

  const [tid, setTid] = useState<number|null>(null);
  const [R16,setR16] = useState<number[]>([]);
  const [QF,setQF]   = useState<number[]>([]);
  const [SF,setSF]   = useState<number[]>([]);
  const [F,setF]     = useState<number[]>([]);

  useEffect(()=>{ loadUsers().then(setUsers).catch(e=>alert("שגיאה בטעינת משתמשים: "+e.message)); },[]);

  const filtered = useMemo(()=>{
    const q=query.trim().toLowerCase(); if(!q) return users;
    return users.filter(u =>
      (u.email||"").toLowerCase().includes(q) ||
      (u.psnUsername||"").toLowerCase().includes(q)
    );
  },[users,query]);

  const toggle = (arr:number[], setter:(x:number[])=>void, id:number, max:number) => {
    setter(arr.includes(id) ? arr.filter(x=>x!==id) : (arr.length<max ? [...arr,id] : arr));
  };

  // ===== החלף את createTournament הקיימת =====
  async function createTournament() {
    // דה-דופליקציה + המרה למספרים
    const seeds16 = uniqueNumeric(R16);
    const missingCount = 16 - seeds16.length;

    if (seeds16.length !== 16) {
      alert(
        `כדי ליצור טורניר צריך לבחור בדיוק 16 שחקנים ייחודיים.\n` +
        `היום בחרת ${R16.length}, ולאחר ניקוי/איחוד התקבלו ${seeds16.length}.\n` +
        (missingCount > 0 ? `חסרים עוד ${missingCount} שחקנים.` : "")
      );
      return;
    }

    const startsAtISO = new Date(startsAt).toISOString(); // אם אתה עובד עם date+time נפרדים – חבר ל-ISO לפני זה

    try {
      const payload = {
        name,
        game,
        startsAt: startsAtISO,
        seeds16,          // שולחים את הייחודיים בלבד
        sendEmails,
      };

      const res = await fetchJSON<{ ok: boolean; tournamentId: number; error?: string; reason?: string; missing?: number[] }>(
        "/api/admin/tournaments/create",
        { method: "POST", body: JSON.stringify(payload) }
      );

      if (!res.ok) {
        // הצגת פירוט סיבה במידה והשרת החזיר reason
        if (res.reason === "users_not_found" && Array.isArray(res.missing)) {
          alert(`חלק מהמשתמשים שנבחרו לא קיימים ב-DB: ${res.missing.join(", ")}`);
        } else if (res.reason === "need_16_players") {
          alert("השרת קיבל פחות מ-16 IDs אחרי בדיקה. נסה לבחור מחדש — או רענן את העמוד.");
        } else {
          alert(`שגיאה ביצירה: ${res.error || "unknown"}`);
        }
        return;
      }

      setTid(res.tournamentId);
      alert(`טורניר נוצר (#${res.tournamentId})`);
    } catch (e: any) {
      // פענוח שגיאת 400 עם גוף JSON מהשרת
      const msg = e?.message || "";
      if (msg.includes("HTTP 400")) {
        try {
          const m = msg.split("|")[1]?.trim();
          if (m) {
            const j = JSON.parse(m);
            if (j?.reason === "users_not_found" && Array.isArray(j?.missing)) {
              alert(`לא נמצאו משתמשים ב-DB: ${j.missing.join(", ")}`);
              return;
            }
            if (j?.reason === "need_16_players") {
              alert("השרת קיבל פחות מ-16 IDs לאחר ניקוי/איחוד. ודא שאין כפילויות או ערכי null.");
              return;
            }
          }
        } catch {/* ניפול ללמטה */}
      }
      alert("שגיאה ביצירת טורניר: " + msg);
    }
  }

  async function saveRound(round:"R16"|"QF"|"SF"|"F") {
    if (!tid) return alert("צור קודם טורניר");
    const map = { R16, QF, SF, F } as const;
    const need = { R16:16, QF:8, SF:4, F:2 }[round];
    const list = map[round];
    
    if (list.length !== need) {
      return alert(`לשלב ${round} יש לבחור ${need} שחקנים (כעת ${list.length})`);
    }
    
    try {
      await fetchJSON(`/api/admin/tournaments/${tid}/assign`, { 
        method:"POST", 
        body: JSON.stringify({ round, userIds:list }) 
      });
      alert(`שלב ${round} נשמר בהצלחה!`);
    } catch (error: any) {
      const errorMsg = error.message || "שגיאה לא ידועה";
      alert(`שגיאה בשמירת השלב ${round}: ${errorMsg}`);
      console.error("Save round error:", error);
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

  const Card = (u:User)=>(
    <div key={u.id} style={userCardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontWeight: 600, color: colors.text.primary }}>
          {u.email}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {u.isOnline && <span style={{ ...badgeStyle, background: colors.success.light, color: colors.success.main }}>🟢 Online</span>}
          <span style={{ ...badgeStyle, background: colors.neutral.gray200, color: colors.text.secondary }}>
            ID {u.id}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "12px", color: colors.text.secondary, marginBottom: "12px" }}>
        PSN: {u.psnUsername || '-'} | Role: {u.role || 'player'} | Status: {u.approvalStatus || 'approved'}
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
          <h1 style={titleStyle}>יצירת טורניר + שיוך ידני</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(["R16", "QF", "SF", "F"] as const).map(stage => {
              const count = {R16,QF,SF,F}[stage].length;
              const max = {R16:16,QF:8,SF:4,F:2}[stage];
              const stageColor = getBadgeColor(stage);
              return (
                <span 
                  key={stage}
                  style={{ 
                    ...badgeStyle, 
                    background: count === max ? stageColor.color : colors.neutral.gray200,
                    color: count === max ? colors.neutral.white : colors.text.primary 
                  }}
                >
                  {stage === "R16" ? "שמינית" : stage === "QF" ? "רבע" : stage === "SF" ? "חצי" : "גמר"} {count}/{max}
                </span>
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
                <option>FC25</option><option>FC24</option><option>PRO_CLUBS</option>
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
            <button onClick={()=>saveRound('R16')} style={buttonStyles.outline}>שמור שמינית</button>
            <button onClick={()=>saveRound('QF')} style={buttonStyles.outline}>שמור רבע</button>
            <button onClick={()=>saveRound('SF')} style={buttonStyles.outline}>שמור חצי</button>
            <button onClick={()=>saveRound('F')}  style={buttonStyles.outline}>שמור גמר</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
