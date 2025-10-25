import React from "react";
import PlayerMatchCard from "./PlayerMatchCard";
import ProofUploader from "./ProofUploader";
import { getRoundName } from "../utils/rounds";
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
}

export default function PlayerDashboardChampions({
  playerInfo,
  tournament,
  myMatches,
  allMatches,
  isMobile,
  getMyOpponents,
  getParallelMatches,
  getMatchResult
}: PlayerDashboardChampionsProps) {
  return (
    <div>
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


      {/* זיכוי כספי - הודעה בולטת */}
      {playerInfo && playerInfo.secondPrizeCredit > 0 && (
        <div className="champions-league-match-card" style={{
          marginBottom: 24,
          padding: isMobile ? 20 : 28,
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          border: "4px solid #FF8C00",
          boxShadow: "0 10px 40px rgba(255, 215, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.3)",
          position: "relative",
          overflow: "hidden",
          animation: "pulse 2s infinite"
        }}>
          {/* אפקט נוצץ */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)",
            animation: "shine 3s infinite"
          }} />
          
          <div style={{ 
            position: "relative", 
            zIndex: 2,
            textAlign: "center"
          }}>
            <div style={{ 
              fontSize: isMobile ? 48 : 64, 
              marginBottom: 12,
              animation: "bounce 1s infinite"
            }}>
              🎁💰
            </div>
            
            <h3 style={{ 
              fontSize: isMobile ? 22 : 32, 
              fontWeight: 900, 
              color: "#8B0000",
              margin: "0 0 8px 0",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)"
            }}>
              יש לך זיכוי כספי!
            </h3>
            
            <div style={{
              fontSize: isMobile ? 36 : 48,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: "16px 0",
              textShadow: "3px 3px 6px rgba(0, 0, 0, 0.4)",
              padding: "12px 24px",
              background: "rgba(139, 0, 0, 0.8)",
              borderRadius: 16,
              display: "inline-block"
            }}>
              ₪ {playerInfo.secondPrizeCredit}
            </div>
            
            <p style={{ 
              fontSize: isMobile ? 16 : 20, 
              color: "#4A0000",
              margin: "12px 0 0 0",
              fontWeight: 700,
              textShadow: "1px 1px 2px rgba(255, 255, 255, 0.5)"
            }}>
              הזיכוי ישמש עבור הטורניר הבא 🏆
            </p>
          </div>
          
          {/* סגנון נוסף - כוכבים מסתובבים */}
          <style>
            {`
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
              }
              
              @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `}
          </style>
        </div>
      )}


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

    </div>
  );
}
