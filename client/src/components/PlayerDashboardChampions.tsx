import React from "react";
import PlayerMatchCard from "./PlayerMatchCard";
import ProofUploader from "./ProofUploader";
import "../styles/championsLeague.css";

interface PlayerDashboardChampionsProps {
  playerInfo: any;
  tournament: any;
  myMatches: any[];
  allMatches: any[];
  isMobile: boolean;
  getMyOpponents: () => string[];
  getParallelMatches: () => any[];
  getMatchResult: (match: any) => { text: string; color: string };
  getRoundName: (round: string) => string;
}

export default function PlayerDashboardChampions({
  playerInfo,
  tournament,
  myMatches,
  allMatches,
  isMobile,
  getMyOpponents,
  getParallelMatches,
  getMatchResult,
  getRoundName
}: PlayerDashboardChampionsProps) {
  const getMyOpponents = () => {
    const opponents = new Set<string>();
    myMatches.forEach(match => {
      if (match.homePsn && match.awayPsn) {
        if (match.myRole === 'home') {
          opponents.add(match.awayPsn);
        } else if (match.myRole === 'away') {
          opponents.add(match.homePsn);
        }
      }
    });
    return Array.from(opponents);
  };

  const getParallelMatches = () => {
    if (!myMatches.length) return [];
    
    const myRounds = new Set(myMatches.map(m => m.round));
    return allMatches.filter(match => 
      myRounds.has(match.round) && 
      !match.isMyMatch &&
      match.homeScore !== null && 
      match.awayScore !== null
    );
  };

  const getMatchResult = (match: any) => {
    if (match.homeScore === null || match.awayScore === null) {
      return { text: "טרם שוחק", color: "#6c757d" };
    }

    const isHome = match.myRole === 'home';
    const myScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    if (myScore > opponentScore) {
      return { text: "ניצחון", color: "#28a745" };
    } else if (myScore < opponentScore) {
      return { text: "הפסד", color: "#dc3545" };
    } else {
      return { text: "תיקו", color: "#ffc107" };
    }
  };

  const getRoundName = (round: string) => {
    switch (round) {
      case 'R16': return 'שמינית גמר';
      case 'QF': return 'רבע גמר';
      case 'SF': return 'חצי גמר';
      case 'F': return 'גמר';
      default: return round;
    }
  };

  return (
    <div className="champions-league-container" style={{
      minHeight: "100vh",
      padding: isMobile ? 16 : 24,
      borderRadius: 20,
      border: "3px solid #FFD700",
      boxShadow: "0 0 50px rgba(255, 215, 0, 0.3), inset 0 0 50px rgba(255, 215, 0, 0.1)"
    }}>
      {/* רקע דרקון */}
      <div className="champions-league-dragon-bg" />
      
      {/* חלקיקים מרחפים */}
      <div className="champions-league-particles">
        {[...Array(15)].map((_, i) => (
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
        textAlign: "center",
        marginBottom: 40,
        position: "relative",
        zIndex: 10
      }}>
        <div className="champions-league-trophy" style={{
          fontSize: isMobile ? 36 : 48,
          marginBottom: 10
        }}>
          🏆
        </div>
        
        <h1 className="champions-league-title" style={{
          fontSize: isMobile ? 28 : 42,
          margin: 0
        }}>
          FC MASTERS CUP
        </h1>
        
        <div className="champions-league-subtitle" style={{
          fontSize: isMobile ? 16 : 18,
          marginTop: 8
        }}>
          PLAYER DASHBOARD
        </div>
        
        <div style={{
          fontSize: isMobile ? 14 : 16,
          fontWeight: 600,
          color: "#FFFFFF",
          marginTop: 4,
          opacity: 0.9
        }}>
          {playerInfo?.email}
        </div>
      </div>

      {/* סטטיסטיקות שחקן */}
      <div className="champions-league-match-card" style={{
        marginBottom: 24,
        padding: isMobile ? 20 : 24
      }}>
        <h3 className="champions-league-title" style={{
          fontSize: isMobile ? 18 : 24,
          marginBottom: 16,
          textAlign: "center"
        }}>
          📊 הסטטיסטיקות שלך
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16
        }}>
          <div style={{
            textAlign: "center",
            padding: 16,
            background: "rgba(40, 167, 69, 0.1)",
            borderRadius: 12,
            border: "2px solid #28a745"
          }}>
            <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 8 }}>🏆</div>
            <div className="champions-league-player-name" style={{ fontSize: isMobile ? 14 : 16 }}>
              ניצחונות: {myMatches.filter(m => getMatchResult(m).text === 'ניצחון').length}
            </div>
          </div>
          
          <div style={{
            textAlign: "center",
            padding: 16,
            background: "rgba(220, 53, 69, 0.1)",
            borderRadius: 12,
            border: "2px solid #dc3545"
          }}>
            <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 8 }}>💔</div>
            <div className="champions-league-player-name" style={{ fontSize: isMobile ? 14 : 16 }}>
              הפסדים: {myMatches.filter(m => getMatchResult(m).text === 'הפסד').length}
            </div>
          </div>
          
          <div style={{
            textAlign: "center",
            padding: 16,
            background: "rgba(255, 193, 7, 0.1)",
            borderRadius: 12,
            border: "2px solid #ffc107"
          }}>
            <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 8 }}>🤝</div>
            <div className="champions-league-player-name" style={{ fontSize: isMobile ? 14 : 16 }}>
              תיקו: {myMatches.filter(m => getMatchResult(m).text === 'תיקו').length}
            </div>
          </div>
        </div>
      </div>

      {/* היריבים שלי */}
      {getMyOpponents().length > 0 && (
        <div className="champions-league-match-card" style={{
          marginBottom: 24,
          padding: isMobile ? 20 : 24
        }}>
          <h3 className="champions-league-title" style={{
            fontSize: isMobile ? 18 : 24,
            marginBottom: 16,
            textAlign: "center"
          }}>
            ⚔️ היריבים שלך בטורניר
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 12
          }}>
            {getMyOpponents().map((opponent, idx) => (
              <div
                key={idx}
                style={{
                  padding: isMobile ? 12 : 16,
                  background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)",
                  borderRadius: 12,
                  border: "2px solid #FFD700",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <PlayerLogo 
                  playerId={`opponent-${idx}`} 
                  playerName={opponent}
                  size={isMobile ? 24 : 32}
                  className="champions-league-player-logo"
                />
                <span className="champions-league-player-name" style={{
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700
                }}>
                  {opponent}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* המשחקים שלי */}
      {myMatches.length > 0 && (
        <div className="champions-league-match-card" style={{
          marginBottom: 24,
          padding: isMobile ? 20 : 24
        }}>
          <h3 className="champions-league-title" style={{
            fontSize: isMobile ? 18 : 24,
            marginBottom: 20,
            textAlign: "center"
          }}>
            🎮 המשחקים שלך בטורניר
          </h3>
          
          {/* קיבוץ לפי שלבים */}
          {(() => {
            const matchesByRound = myMatches.reduce((acc, match) => {
              if (!acc[match.round]) acc[match.round] = [];
              acc[match.round].push(match);
              return acc;
            }, {} as Record<string, typeof myMatches>);

            const roundOrder = ['R16', 'QF', 'SF', 'F'];
            
            return (
              <div style={{ display: "grid", gap: isMobile ? 20 : 24 }}>
                {roundOrder.filter(round => matchesByRound[round]).map(round => (
                  <div key={round}>
                    <div className="champions-league-round-badge" style={{
                      padding: "10px 20px",
                      borderRadius: 25,
                      fontSize: 16,
                      marginBottom: 16,
                      textAlign: "center"
                    }}>
                      {getRoundName(round)}
                    </div>
                    
                    <div style={{ display: "grid", gap: isMobile ? 12 : 16 }}>
                      {matchesByRound[round].map((match) => (
                        <div key={match.id}>
                          <PlayerMatchCard
                            match={match}
                            result={getMatchResult(match)}
                            isMobile={isMobile}
                          />
                          
                          {/* העלאת תמונה proof */}
                          {match.homeScore !== null && match.awayScore !== null && (
                            <ProofUploader
                              matchId={match.id}
                              match={match}
                              isMobile={isMobile}
                              onUploadSuccess={() => {
                                // רענון הנתונים אחרי העלאה מוצלחת
                                window.location.reload();
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* משחקים מקבילים */}
      {getParallelMatches().length > 0 && (
        <div className="champions-league-match-card" style={{
          marginBottom: 24,
          padding: isMobile ? 20 : 24
        }}>
          <h3 className="champions-league-title" style={{
            fontSize: isMobile ? 18 : 24,
            marginBottom: 16,
            textAlign: "center"
          }}>
            🔄 משחקים מקבילים
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 12
          }}>
            {getParallelMatches().slice(0, 4).map((match) => (
              <div
                key={match.id}
                style={{
                  padding: isMobile ? 12 : 16,
                  background: "linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 123, 255, 0.05) 100%)",
                  borderRadius: 12,
                  border: "2px solid #007BFF",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span className="champions-league-player-name" style={{
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 600
                }}>
                  {match.homePsn} vs {match.awayPsn}
                </span>
                <div className="champions-league-score" style={{
                  fontSize: isMobile ? 14 : 16
                }}>
                  {match.homeScore}:{match.awayScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* כיתובים בתחתית */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 40,
        position: "relative",
        zIndex: 10
      }}>
        <div className="champions-league-hashtag" style={{
          fontSize: isMobile ? 12 : 14
        }}>
          #FCMastersCup
        </div>
        
        <div className="champions-league-website" style={{
          fontSize: isMobile ? 12 : 14
        }}>
          FC Masters Cup.com
        </div>
      </div>
    </div>
  );
}
