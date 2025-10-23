import React, { useRef, useEffect, useState } from "react";
import BracketConnector from "./BracketConnector";
import PlayerLogo from "./PlayerLogo";
import "../styles/championsLeague.css";

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

interface ChampionsLeagueBracketProps {
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

export default function ChampionsLeagueBracket({ matches, players, onRefresh }: ChampionsLeagueBracketProps) {
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

  // חישוב מיקומי משחקים
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    setContainerSize({ width: containerWidth, height: containerHeight });

    const positions: MatchPosition[] = [];
    const roundWidth = containerWidth / 4; // 4 שלבים
    const matchHeight = 140; // גובה כל משחק

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
      className="champions-league-container"
      style={{ 
        position: "relative",
        minHeight: "700px",
        borderRadius: 20,
        padding: 40,
        overflow: "hidden",
        direction: "rtl",
        textAlign: "right",
        border: "3px solid #FFD700",
        boxShadow: "0 0 50px rgba(255, 215, 0, 0.3), inset 0 0 50px rgba(255, 215, 0, 0.1)"
      }}
    >
      {/* רקע דרקון */}
      <div className="champions-league-dragon-bg" />
      
      {/* חלקיקים מרחפים */}
      <div className="champions-league-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="champions-league-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* כותרת כללית */}
      <div style={{
        position: "absolute",
        top: 30,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        textAlign: "center"
      }}>
        {/* לוגו UEFA */}
        <div className="champions-league-trophy" style={{
          fontSize: 48,
          marginBottom: 10
        }}>
          🏆
        </div>
        
        <h1 className="champions-league-title" style={{
          fontSize: 42,
          margin: 0
        }}>
          FC MASTERS CUP
        </h1>
        
        <div className="champions-league-subtitle" style={{
          fontSize: 18,
          marginTop: 8
        }}>
          ROAD TO VICTORY
        </div>
        
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#FFFFFF",
          marginTop: 4,
          opacity: 0.9
        }}>
          LAST 16 FIXTURES
        </div>
      </div>

      {/* רקע שלבים */}
      {rounds.map((round, index) => {
        const roundMatches = groupByRound(round.key);
        if (roundMatches.length === 0) return null;

        const roundWidth = containerSize.width / 4;
        const totalHeight = roundMatches.length * 140;
        const startY = (containerSize.height - totalHeight) / 2;

        return (
          <div
            key={round.key}
            className="champions-league-round-container"
            style={{
              position: "absolute",
              left: index * roundWidth,
              top: startY - 20,
              width: roundWidth,
              height: totalHeight + 40,
              zIndex: 2
            }}
          >
            {/* כותרת שלב */}
            <div className="champions-league-round-badge" style={{
              position: "absolute",
              top: -35,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 20px",
              borderRadius: 25,
              fontSize: 14
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

        const homePlayer = getPlayer(match.homeId);
        const awayPlayer = getPlayer(match.awayId);
        
        return (
          <div
            key={match.id}
            style={{
              position: "absolute",
              left: position.x - 160, // מרכז הכרטיס
              top: position.y - 70,   // מרכז הכרטיס
              width: 320,
              height: 140,
              zIndex: 5
            }}
          >
            <div className={`champions-league-match-card ${match.status === 'completed' ? 'completed' : ''}`} style={{
              padding: 20,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              {/* כותרת שלב קטנה */}
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#007BFF",
                marginBottom: 8,
                textAlign: "center",
                background: "linear-gradient(135deg, #007BFF 0%, #0056b3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                {rounds.find(r => r.key === match.round)?.label}
              </div>

              {/* שמות שחקנים */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <PlayerLogo 
                    playerId={match.homeId} 
                    playerName={homePlayer?.psn}
                    size={28}
                    className="champions-league-player-logo"
                  />
                  <span className="champions-league-player-name" style={{
                    fontSize: 16,
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#000"
                  }}>
                    {homePlayer?.psn || 'TBD'}
                  </span>
                </div>
                
                <div className="champions-league-vs-text" style={{
                  fontSize: 24,
                  minWidth: 60,
                  textAlign: "center"
                }}>
                  VS
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexDirection: "row-reverse"
                }}>
                  <span className="champions-league-player-name" style={{
                    fontSize: 16,
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#000"
                  }}>
                    {awayPlayer?.psn || 'TBD'}
                  </span>
                  <PlayerLogo 
                    playerId={match.awayId} 
                    playerName={awayPlayer?.psn}
                    size={28}
                    className="champions-league-player-logo"
                  />
                </div>
              </div>

              {/* תוצאה */}
              <div className="champions-league-score" style={{
                fontSize: 28,
                textAlign: "center"
              }}>
                {match.homeScore !== null && match.awayScore !== null 
                  ? `${match.homeScore} : ${match.awayScore}`
                  : "טרם שוחק"
                }
              </div>

              {/* סטטוס */}
              <div className={match.status === 'completed' ? 'champions-league-status-completed' : 'champions-league-status-pending'} style={{
                fontSize: 12,
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
        bottom: 30,
        right: 30,
        zIndex: 10
      }}>
        <button
          onClick={onRefresh}
          className="champions-league-refresh-button"
          style={{
            padding: "15px 30px",
            borderRadius: 30,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          🔄 רענן תוצאות
        </button>
      </div>

      {/* כיתובים בתחתית */}
      <div className="champions-league-hashtag" style={{
        position: "absolute",
        bottom: 30,
        left: 30,
        zIndex: 10,
        fontSize: 14
      }}>
        #FCMastersCup
      </div>
      
      <div className="champions-league-website" style={{
        position: "absolute",
        bottom: 30,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        fontSize: 14
      }}>
        FC Masters Cup.com
      </div>
    </div>
  );
}
