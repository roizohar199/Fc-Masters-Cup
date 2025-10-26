import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJSON } from "../../utils/fetchJSON";
import { colors, shadows } from "../../styles";

type Match = { id:number; round:'R16'|'QF'|'SF'|'F'; pos:number; p1:number|null; p2:number|null; winner:number|null };
type Participant = { userId:number; displayName?:string; email:string; psn?:string; stage:string };

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: colors.background.gradient,
  padding: "24px",
};

const mainContentStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 800,
  color: colors.neutral.white,
  textAlign: "center",
  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  marginBottom: "8px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(255, 255, 255, 0.8)",
  textAlign: "center",
  marginBottom: "32px",
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: shadows.lg,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: "16px",
  textAlign: "center",
};

const matchCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  marginBottom: "12px",
};

const playerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 0",
  fontSize: "15px",
  fontWeight: 500,
};

const winnerStyle: React.CSSProperties = {
  fontSize: "13px",
  color: colors.success.main,
  fontWeight: 600,
  marginTop: "8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const emptyStateStyle: React.CSSProperties = {
  color: colors.text.secondary,
  fontStyle: "italic",
  textAlign: "center",
  padding: "32px",
};

export default function TournamentBracketLive() {
  const { id } = useParams<{ id: string }>();
  const tid = Number(id);
  const [name,setName] = useState("");
  const [matches,setMatches] = useState<Match[]>([]);
  const [participants,setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const nameOf = (id:number|null)=>{
    if(!id) return '-';
    const p = participants.find(x=>x.userId===id);
    return p?.displayName || p?.email || String(id);
  };

  async function load(){
    try {
      const d = await fetchJSON<any>(`/api/tournaments/${tid}/bracket`);
      setName(d.tournament?.name || "");
      setMatches(d.matches || []);
      setParticipants(d.participants || []);
    } catch (error) {
      console.error("Failed to load tournament data:", error);
    }
  }

  useEffect(()=>{
    load();
    
    // התחברות ל-SSE לעדכונים חיים
    const es = new EventSource(`/api/tournaments/${tid}/stream`, { withCredentials:true });
    
    es.onopen = () => {
      console.log("SSE connection opened");
      setIsConnected(true);
    };
    
    es.onmessage = (e)=>{
      try{
        const msg = JSON.parse(e.data);
        if (msg?.type==='bracket' && msg.bracket){
          setName(msg.bracket.tournament?.name || "");
          setMatches(msg.bracket.matches || []);
          setParticipants(msg.bracket.participants || []);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };
    
    es.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsConnected(false);
    };
    
    return ()=> {
      es.close();
      setIsConnected(false);
    };
  },[tid]);

  const getRoundName = (round: 'R16'|'QF'|'SF'|'F') => {
    const names = {
      'R16': 'שמינית הגמר',
      'QF': 'רבע הגמר', 
      'SF': 'חצי הגמר',
      'F': 'הגמר'
    };
    return names[round];
  };

  const getRoundColor = (round: 'R16'|'QF'|'SF'|'F') => {
    const colorMap = {
      'R16': colors.stages.r16,
      'QF': colors.stages.qf,
      'SF': colors.stages.sf,
      'F': colors.stages.final,
    };
    return colorMap[round];
  };

  const Section = (label:string, round:'R16'|'QF'|'SF'|'F')=>{
    const rows = matches.filter(m=>m.round===round);
    const roundColor = getRoundColor(round);
    
    return (
      <div style={{...sectionStyle, borderTop: `4px solid ${roundColor.border}`}}>
        <h3 style={{...sectionTitleStyle, color: roundColor.border}}>{label}</h3>
        <div>
          {rows.map(m=>(
            <div key={m.id} style={matchCardStyle}>
              <div style={{ fontSize: "12px", color: colors.text.secondary, marginBottom: "8px" }}>
                משחק #{m.pos} • {round}
              </div>
              <div style={playerStyle}>
                <span style={{ 
                  width: "20px", 
                  height: "20px", 
                  background: roundColor.border, 
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.neutral.white,
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  A
                </span>
                {nameOf(m.p1)}
              </div>
              <div style={{...playerStyle, color: colors.text.secondary}}>
                <span style={{ 
                  width: "20px", 
                  height: "20px", 
                  background: colors.neutral.gray400, 
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.neutral.white,
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  B
                </span>
                {nameOf(m.p2)}
              </div>
              {m.winner && (
                <div style={winnerStyle}>
                  🏆 מנצח: {nameOf(m.winner)}
                </div>
              )}
            </div>
          ))}
          {rows.length===0 && <div style={emptyStateStyle}>טרם נקבע</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={mainContentStyle}>
        <h1 style={titleStyle}>{name || "טורניר"}</h1>
        <p style={subtitleStyle}>
          העמוד מתעדכן אוטומטית בעת שינויים
          {isConnected && (
            <span style={{ color: colors.success.main, marginRight: "8px" }}>
              • 🟢 מחובר
            </span>
          )}
        </p>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "24px" 
        }}>
          {Section(getRoundName("R16"),"R16")}
          {Section(getRoundName("QF"),"QF")}
          {Section(getRoundName("SF"),"SF")}
          {Section(getRoundName("F"),"F")}
        </div>
      </div>
    </div>
  );
}
