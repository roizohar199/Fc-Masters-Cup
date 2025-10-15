import React, { useState } from "react";

interface Match {
  id: string;
  round: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  token: string;
  pin: string;
}

interface Player {
  id: string;
  psn: string;
  displayName: string;
}

interface MatchCardProps {
  match: Match;
  homePlayer?: Player;
  awayPlayer?: Player;
  onRefresh?: () => void;
}

export default function MatchCard({ match, homePlayer, awayPlayer, onRefresh }: MatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";
      case "DISPUTED": return "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
      case "PENDING": return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
      default: return "#999";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "✅ אושר";
      case "DISPUTED": return "⚠️ במחלוקת";
      case "PENDING": return "⏳ ממתין";
      default: return status;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("הועתק ללוח!");
  };

  const submissionUrl = `${window.location.origin}/submit/${match.id}`;

  return (
    <div style={{
      border: "2px solid #f0f0f0",
      borderRadius: 12,
      padding: 16,
      background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      direction: "rtl",
      transition: "all 0.3s"
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    }}
    >
      {/* Status Badge */}
      <div style={{
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 700,
        color: "#fff",
        background: getStatusColor(match.status),
        marginBottom: 12,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
      }}>
        {getStatusLabel(match.status)}
      </div>

      {/* Players */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 8px",
          borderBottom: "2px solid #f0f0f0",
          background: match.homeScore !== null && match.awayScore !== null && match.homeScore > (match.awayScore || 0) 
            ? "rgba(67, 233, 123, 0.1)" 
            : "transparent",
          borderRadius: "8px 8px 0 0"
        }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {homePlayer?.displayName || "TBD"}
            <div style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>
              {homePlayer?.psn}
            </div>
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 800,
            minWidth: 70,
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {match.homeScore ?? "-"}
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 8px",
          background: match.homeScore !== null && match.awayScore !== null && match.awayScore > (match.homeScore || 0) 
            ? "rgba(67, 233, 123, 0.1)" 
            : "transparent",
          borderRadius: "0 0 8px 8px"
        }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {awayPlayer?.displayName || "TBD"}
            <div style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>
              {awayPlayer?.psn}
            </div>
          </div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 800,
            minWidth: 70,
            textAlign: "center",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {match.awayScore ?? "-"}
          </div>
        </div>
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: "100%",
          padding: "10px",
          border: "2px solid #f0f0f0",
          borderRadius: 8,
          background: showDetails ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fafafa",
          color: showDetails ? "#fff" : "#333",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          transition: "all 0.3s"
        }}
      >
        {showDetails ? "הסתר פרטים ▲" : "הצג פרטים ▼"}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div style={{
          marginTop: 12,
          padding: 16,
          background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
          borderRadius: 8,
          fontSize: 13,
          border: "2px solid #f0f0f0"
        }}>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#667eea" }}>Match ID:</strong>
            <div style={{ 
              fontFamily: "monospace", 
              fontSize: 11, 
              wordBreak: "break-all",
              color: "#666",
              marginTop: 4,
              padding: 8,
              background: "#fff",
              borderRadius: 6
            }}>
              {match.id}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#667eea" }}>PIN למשחק:</strong>
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 8
            }}>
              <code style={{
                flex: 1,
                padding: "10px 16px",
                background: "linear-gradient(135deg, #fff 0%, #f5f5f5 100%)",
                border: "2px solid #667eea",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 3,
                textAlign: "center",
                color: "#667eea"
              }}>
                {match.pin}
              </code>
              <button
                onClick={() => copyToClipboard(match.pin)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(67, 233, 123, 0.3)"
                }}
              >
                העתק
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#667eea" }}>קישור הגשה לשחקנים:</strong>
            <div style={{
              display: "flex",
              gap: 8,
              marginTop: 8
            }}>
              <input
                readOnly
                value={submissionUrl}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "monospace",
                  background: "#fff"
                }}
              />
              <button
                onClick={() => copyToClipboard(submissionUrl)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(79, 172, 254, 0.3)"
                }}
              >
                העתק
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: "#667eea" }}>Token פרטי:</strong>
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 8
            }}>
              <code style={{
                flex: 1,
                padding: "10px",
                background: "#fff",
                border: "2px solid #e0e0e0",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "monospace"
              }}>
                {match.token}
              </code>
              <button
                onClick={() => copyToClipboard(match.token)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(250, 112, 154, 0.3)"
                }}
              >
                העתק
              </button>
            </div>
            <div style={{ 
              fontSize: 11, 
              color: "#666", 
              marginTop: 6,
              padding: 8,
              background: "#fff3e0",
              borderRadius: 6,
              border: "1px solid #ff9800"
            }}>
              ⚠️ שלח טוקן זה באופן פרטי לשני השחקנים
            </div>
          </div>

          <a
            href={submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "14px",
              textAlign: "center",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            🚀 פתח דף הגשה
          </a>
        </div>
      )}
    </div>
  );
}
