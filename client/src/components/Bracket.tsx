import React, { useRef, useEffect, useState } from "react";
import MatchCard from "./MatchCard";
import BracketConnector from "./BracketConnector";

interface Match {
  id: string;
  round: string;
  homeId: string;
  awayId: string;
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

interface BracketProps {
  matches: Match[];
  players: Player[];
  onRefresh?: () => void;
}

interface MatchPosition {
  matchId: string;
  x: number;
  y: number;
  round: string;
}

export default function Bracket({ matches, players, onRefresh }: BracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const getPlayer = (id: string) => players.find(p => p.id === id);
  
  const groupByRound = (round: string) => matches.filter(m => m.round === round);

  const rounds: Array<{ key: string; label: string; order: number }> = [
    { key: "R16", label: "שמינית גמר", order: 0 },
    { key: "QF", label: "רבע גמר", order: 1 },
    { key: "SF", label: "חצי גמר", order: 2 },
    { key: "F", label: "גמר", order: 3 }
  ];

  const roundColors = {
    R16: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "#667eea", light: "#667eea20" },
    QF: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", border: "#f093fb", light: "#f093fb20" },
    SF: { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", border: "#4facfe", light: "#4facfe20" },
    F: { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", border: "#43e97b", light: "#43e97b20" }
  };

  // חישוב מיקומי משחקים
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    setContainerSize({ width: containerWidth, height: containerHeight });

    const positions: MatchPosition[] = [];
    const roundWidth = containerWidth / 4; // 4 שלבים
    const matchHeight = 120; // גובה כל משחק

    rounds.forEach((round, roundIndex) => {
      const roundMatches = groupByRound(round.key);
      const totalHeight = roundMatches.length * matchHeight;
      const startY = (containerHeight - totalHeight) / 2;

      roundMatches.forEach((match, matchIndex) => {
        const x = roundIndex * roundWidth + roundWidth / 2;
        const y = startY + matchIndex * matchHeight + matchHeight / 2;

        positions.push({
          matchId: match.id,
          x,
          y,
          round: round.key
        });
      });
    });

    setMatchPositions(positions);
  }, [matches, containerSize.width]);

  // חישוב חיבורים בין שלבים
  const getConnections = () => {
    const connections: Array<{
      from: MatchPosition;
      to: MatchPosition;
      round: string;
    }> = [];

    // חיבור משחקי R16 ל-QF
    const r16Matches = matchPositions.filter(p => p.round === 'R16');
    const qfMatches = matchPositions.filter(p => p.round === 'QF');

    r16Matches.forEach((r16Match, index) => {
      const qfMatch = qfMatches[Math.floor(index / 2)];
      if (qfMatch) {
        connections.push({
          from: r16Match,
          to: qfMatch,
          round: 'QF'
        });
      }
    });

    // חיבור משחקי QF ל-SF
    const sfMatches = matchPositions.filter(p => p.round === 'SF');
    qfMatches.forEach((qfMatch, index) => {
      const sfMatch = sfMatches[Math.floor(index / 2)];
      if (sfMatch) {
        connections.push({
          from: qfMatch,
          to: sfMatch,
          round: 'SF'
        });
      }
    });

    // חיבור משחקי SF ל-F
    const fMatches = matchPositions.filter(p => p.round === 'F');
    sfMatches.forEach((sfMatch, index) => {
      const fMatch = fMatches[Math.floor(index / 2)];
      if (fMatch) {
        connections.push({
          from: sfMatch,
          to: fMatch,
          round: 'F'
        });
      }
    });

    return connections;
  };

  // עדכון גודל המכל
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: "relative",
        minHeight: "600px",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        borderRadius: 16,
        padding: 40,
        overflow: "hidden",
        direction: "rtl",
        textAlign: "right"
      }}
    >
      {/* כותרת כללית */}
      <div style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#333",
          margin: 0,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          🏆 סיבוב הטורניר - FIFA/UEFA Style
        </h2>
      </div>

      {/* רקע שלבים */}
      {rounds.map((round, index) => {
        const roundMatches = groupByRound(round.key);
        if (roundMatches.length === 0) return null;

        const roundWidth = containerSize.width / 4;
        const totalHeight = roundMatches.length * 120;
        const startY = (containerSize.height - totalHeight) / 2;

        return (
          <div
            key={round.key}
            style={{
              position: "absolute",
              left: index * roundWidth,
              top: startY - 20,
              width: roundWidth,
              height: totalHeight + 40,
              background: roundColors[round.key as keyof typeof roundColors].light,
              border: `2px solid ${roundColors[round.key as keyof typeof roundColors].border}`,
              borderRadius: 12,
              zIndex: 2
            }}
          >
            {/* כותרת שלב */}
            <div style={{
              position: "absolute",
              top: -30,
              left: "50%",
              transform: "translateX(-50%)",
              background: roundColors[round.key as keyof typeof roundColors].bg,
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
            }}>
              {round.label}
            </div>
          </div>
        );
      })}

      {/* חיבורים בין שלבים */}
      {getConnections().map((connection, index) => (
        <BracketConnector
          key={`${connection.from.matchId}-${connection.to.matchId}`}
          fromX={connection.from.x}
          fromY={connection.from.y}
          toX={connection.to.x}
          toY={connection.to.y}
          round={connection.round}
        />
      ))}

      {/* כרטיסי משחקים */}
      {matchPositions.map((position) => {
        const match = matches.find(m => m.id === position.matchId);
        if (!match) return null;

        const roundColor = roundColors[match.round as keyof typeof roundColors];
        
        return (
          <div
            key={match.id}
            style={{
              position: "absolute",
              left: position.x - 140, // מרכז הכרטיס
              top: position.y - 60,   // מרכז הכרטיס
              width: 280,
              height: 120,
              zIndex: 5
            }}
          >
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              border: `3px solid ${roundColor.border}`,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              {/* כותרת שלב קטנה */}
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: roundColor.border,
                marginBottom: 8,
                textAlign: "center"
              }}>
                {rounds.find(r => r.key === match.round)?.label}
              </div>

              {/* שמות שחקנים */}
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#333",
                textAlign: "center",
                marginBottom: 8,
                lineHeight: 1.4
              }}>
                {getPlayer(match.homeId)?.psn || 'TBD'} vs {getPlayer(match.awayId)?.psn || 'TBD'}
              </div>

              {/* תוצאה */}
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: match.homeScore !== null && match.awayScore !== null ? "#333" : "#999",
                textAlign: "center"
              }}>
                {match.homeScore !== null && match.awayScore !== null 
                  ? `${match.homeScore}:${match.awayScore}`
                  : "טרם שוחק"
                }
              </div>

              {/* סטטוס */}
              <div style={{
                fontSize: 12,
                color: match.status === 'completed' ? "#28a745" : "#6c757d",
                textAlign: "center",
                marginTop: 4
              }}>
                {match.status === 'completed' ? "✅ הושלם" : "⏳ ממתין"}
              </div>
            </div>
          </div>
        );
      })}

      {/* כפתור רענון */}
      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 10
      }}>
        <button
          onClick={onRefresh}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 25,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          🔄 רענן
        </button>
      </div>
    </div>
  );
}