import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { useStore } from "../store";

interface PlayerInfo {
  email: string;
  role: string;
  secondPrizeCredit: number;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  createdAt: string;
  prizeFirst: number;
  prizeSecond: number;
  nextTournamentDate?: string;
  telegramLink?: string;
}

interface Match {
  id: string;
  round: string;
  homePsn: string;
  awayPsn: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  isMyMatch: boolean;
  myRole?: "home" | "away";
}

export default function PlayerDashboard() {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { tournamentId } = useStore();

  useEffect(() => {
    loadData();
  }, [tournamentId]); // נטען מחדש כאשר tournamentId משתנה

  // לוג נוסף לבדיקת store
  useEffect(() => {
    console.log("🔍 PlayerDashboard - tournamentId מ-store:", tournamentId);
  }, [tournamentId]);

  async function loadData() {
    console.log("🔄 PlayerDashboard - טוען נתונים מחדש עם tournamentId:", tournamentId);
    setLoading(true);
    try {
      // טעינת פרטי משתמש
      const me = await api("/api/auth/me");
      setPlayerInfo(me);

      // טעינת טורניר פעיל (לא בהכרח האחרון)
      const tournaments = await api("/api/tournaments");
      console.log("🏆 טורנירים שהתקבלו:", tournaments);
      console.log("🔍 tournamentId מ-store:", tournamentId);
      
      if (tournaments && tournaments.length > 0) {
        let selectedTournament;
        
        // נחפש טורניר עם קישור טלגרם (עדיפות ראשונה)
        const tournamentWithTelegram = tournaments.find(t => t.telegramLink && t.telegramLink.trim() !== "");
        
        if (tournamentWithTelegram) {
          selectedTournament = tournamentWithTelegram;
          console.log("🎯 נמצא טורניר עם קישור טלגרם:", selectedTournament);
        }
        // אם יש tournamentId ב-store, נחפש את הטורניר הספציפי
        else if (tournamentId) {
          selectedTournament = tournaments.find(t => t.id === tournamentId);
          console.log("🎯 חיפוש טורניר לפי ID:", tournamentId);
          console.log("🎯 טורניר שנמצא:", selectedTournament);
        }
        
        // אם לא מצאנו או שאין tournamentId, ניקח את הטורניר האחרון
        if (!selectedTournament) {
          selectedTournament = tournaments[tournaments.length - 1];
          console.log("🎯 לא נמצא טורניר ספציפי, לוקח את האחרון:", selectedTournament);
        }
        
        console.log("🎯 הטורניר שנבחר:", selectedTournament);
        console.log("📱 קישור טלגרם בטורניר:", selectedTournament.telegramLink);
        console.log("🔍 בדיקת תנאי הצגת קישור טלגרם:", {
          hasTournament: !!selectedTournament,
          hasTelegramLink: !!selectedTournament.telegramLink,
          telegramLinkValue: selectedTournament.telegramLink,
          isEmpty: selectedTournament.telegramLink === "",
          isNull: selectedTournament.telegramLink === null,
          isUndefined: selectedTournament.telegramLink === undefined
        });
        setTournament(selectedTournament);

        // טעינת משחקים
        const bracket = await api(`/api/tournaments/${selectedTournament.id}/bracket`);
        if (bracket && bracket.matches) {
          const email = me.email;
          const matches = bracket.matches.map((m: any) => ({
            id: m.id,
            round: m.round,
            homePsn: m.homePsn,
            awayPsn: m.awayPsn,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            isMyMatch: m.homePsn === email || m.awayPsn === email,
            myRole: m.homePsn === email ? "home" : m.awayPsn === email ? "away" : undefined
          }));

          setAllMatches(matches);
          setMyMatches(matches.filter((m: Match) => m.isMyMatch));
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRoundName = (round: string) => {
    switch (round) {
      case "R16": return "שמינית גמר";
      case "QF": return "רבע גמר";
      case "SF": return "חצי גמר";
      case "F": return "גמר";
      default: return round;
    }
  };

  const getMatchResult = (match: Match) => {
    if (match.homeScore === null || match.awayScore === null) {
      return { text: "ממתין לתוצאה", color: "#999" };
    }
    
    if (!match.isMyMatch) {
      return { text: `${match.homeScore} : ${match.awayScore}`, color: "#333" };
    }

    const won = match.myRole === "home" 
      ? match.homeScore > match.awayScore
      : match.awayScore > match.homeScore;
    
    return {
      text: `${match.homeScore} : ${match.awayScore}`,
      color: won ? "#4caf50" : "#f44336"
    };
  };

  const getCurrentRound = () => {
    if (!myMatches.length) return null;
    
    // מצא את המשחק האחרון שלי שטרם הושלם
    const pending = myMatches.find(m => m.homeScore === null || m.awayScore === null);
    if (pending) return getRoundName(pending.round);
    
    // אם כל המשחקים הושלמו, החזר את הסיבוב האחרון
    return getRoundName(myMatches[myMatches.length - 1].round);
  };

  const getMyOpponents = () => {
    return myMatches.map(m => m.myRole === "home" ? m.awayPsn : m.homePsn);
  };

  const getParallelMatches = () => {
    if (!myMatches.length) return [];
    const myCurrentRound = myMatches.find(m => m.homeScore === null || m.awayScore === null)?.round;
    if (!myCurrentRound) return [];
    
    return allMatches.filter(m => m.round === myCurrentRound && !m.isMyMatch);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24, direction: "rtl" }}>
      {/* כרטיס ברכה */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 32,
        borderRadius: 16,
        color: "#fff",
        boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)"
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
          שלום, {playerInfo?.email}! ⚽
        </h2>
        <p style={{ fontSize: 16, opacity: 0.9 }}>
          ברוך הבא לאזור השחקנים של FC Masters Cup
        </p>
      </div>

      {/* זיכוי פרס שני */}
      {playerInfo && playerInfo.secondPrizeCredit > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(255, 215, 0, 0.3)",
          border: "3px solid #ffa000"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 48 }}>🎁</div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#d84315", margin: 0 }}>
                יש לך זיכוי פרס שני!
              </h3>
              <p style={{ fontSize: 18, color: "#5d4037", margin: "8px 0 0 0" }}>
                סכום הזיכוי: <strong>{playerInfo.secondPrizeCredit} ₪</strong> לטורניר הקרוב
              </p>
            </div>
          </div>
        </div>
      )}

      {/* פרק זמן לטורניר הבא */}
      {tournament?.nextTournamentDate && (
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: 20,
          borderRadius: 16,
          border: "2px solid #2196F3"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 36 }}>⏰</div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1976D2", margin: 0 }}>
                הטורניר הבא
              </h3>
              <p style={{ fontSize: 16, color: "#1565C0", margin: "8px 0 0 0" }}>
                {tournament.nextTournamentDate}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* קישור טלגרם */}
      {(() => {
        console.log("🔍 בדיקת תנאי הצגת קישור טלגרם:", {
          tournament: !!tournament,
          telegramLink: tournament?.telegramLink,
          shouldShow: !!(tournament?.telegramLink)
        });
        return null;
      })()}
      {tournament?.telegramLink && (
        <div style={{
          backgroundColor: "#e1f5fe",
          padding: 20,
          borderRadius: 16,
          border: "2px solid #0288d1"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#01579b", margin: 0 }}>
                  הצטרף לקבוצת הטלגרם
                </h3>
                <p style={{ fontSize: 14, color: "#0277bd", margin: "4px 0 0 0" }}>
                  קבל עדכונים ושוחח עם שחקנים אחרים
                </p>
              </div>
            </div>
            <a 
              href={tournament.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 24px",
                background: "#0288d1",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15
              }}
            >
              הצטרף 📱
            </a>
          </div>
        </div>
      )}

      {/* סטטוס הטורניר הנוכחי */}
      {getCurrentRound() && (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 24,
          borderRadius: 16,
          color: "#fff",
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 48 }}>🎯</div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                השלב הנוכחי שלך
              </h3>
              <p style={{ fontSize: 16, opacity: 0.9, margin: "4px 0 0 0" }}>
                {getCurrentRound()}
              </p>
            </div>
          </div>
          
          {/* סטטיסטיקות מהירות */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
            gap: 16,
            marginTop: 20
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: 16,
              borderRadius: 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{myMatches.length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>משחקים שלי</div>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: 16,
              borderRadius: 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{getMyOpponents().length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>יריבים</div>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: 16,
              borderRadius: 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{getParallelMatches().length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>משחקים מקבילים</div>
            </div>
          </div>
        </div>
      )}

      {/* היריבים שלי */}
      {getMyOpponents().length > 0 && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#333" }}>
            ⚔️ היריבים שלך בטורניר
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            {getMyOpponents().map((opponent, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
                  borderRadius: 10,
                  border: "2px solid #f0f0f0",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#333"
                }}
              >
                {opponent}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* המשחקים שלי */}
      {myMatches.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          border: "3px solid #667eea"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 32 }}>🏆</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#333" }}>
              המשחקים שלי בטורניר
            </h3>
          </div>
          
          {/* קיבוץ לפי שלבים */}
          {(() => {
            const matchesByRound = myMatches.reduce((acc, match) => {
              if (!acc[match.round]) acc[match.round] = [];
              acc[match.round].push(match);
              return acc;
            }, {} as Record<string, typeof myMatches>);

            const roundOrder = ['R16', 'QF', 'SF', 'F'];
            
            return (
              <div style={{ display: "grid", gap: 20 }}>
                {roundOrder.filter(round => matchesByRound[round]).map(round => (
                  <div key={round}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                      borderRadius: 8,
                      border: "1px solid #667eea30"
                    }}>
                      <div style={{ fontSize: 16 }}>🎯</div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#667eea" }}>
                        {getRoundName(round)}
                      </h4>
                    </div>
                    
                    <div style={{ display: "grid", gap: 12 }}>
                      {matchesByRound[round].map((match) => {
                        const result = getMatchResult(match);
                        const isWinner = result.text.includes('ניצחון');
                        const isLoss = result.text.includes('הפסד');
                        const isDraw = result.text.includes('תיקו');
                        
                        return (
                          <div
                            key={match.id}
                            style={{
                              padding: 20,
                              background: isWinner 
                                ? "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)"
                                : isLoss 
                                  ? "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)"
                                  : "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                              borderRadius: 12,
                              border: `2px solid ${
                                isWinner ? "#28a745" : isLoss ? "#dc3545" : "#ffc107"
                              }`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              position: "relative",
                              overflow: "hidden"
                            }}
                          >
                            {/* אפקט ניצחון/הפסד */}
                            <div style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              width: "100%",
                              height: 4,
                              background: isWinner 
                                ? "linear-gradient(90deg, #28a745 0%, #20c997 100%)"
                                : isLoss 
                                  ? "linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)"
                                  : "linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)"
                            }} />
                            
                            <div>
                              <div style={{ 
                                fontSize: 18, 
                                fontWeight: 600, 
                                color: "#333",
                                marginBottom: 4
                              }}>
                                {match.homePsn} vs {match.awayPsn}
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}>
                                <span>{getRoundName(match.round)}</span>
                                <span>•</span>
                                <span>{match.myRole === 'home' ? 'מארח' : 'אורח'}</span>
                              </div>
                            </div>
                            
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12
                            }}>
                              {match.homeScore !== null && match.awayScore !== null && (
                                <div style={{
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: "#333",
                                  padding: "8px 16px",
                                  background: "rgba(255, 255, 255, 0.8)",
                                  borderRadius: 8
                                }}>
                                  {match.homeScore}:{match.awayScore}
                                </div>
                              )}
                              <div style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: result.color,
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                              }}>
                                {isWinner && <span>🏆</span>}
                                {isLoss && <span>💔</span>}
                                {isDraw && <span>🤝</span>}
                                {result.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e9ecef"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 20 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#666" }}>
              משחקים מקבילים באותו שלב
            </h3>
          </div>
          
          {/* קיבוץ לפי שלבים */}
          {(() => {
            const parallelMatchesByRound = getParallelMatches().reduce((acc, match) => {
              if (!acc[match.round]) acc[match.round] = [];
              acc[match.round].push(match);
              return acc;
            }, {} as Record<string, typeof getParallelMatches>);

            const roundOrder = ['R16', 'QF', 'SF', 'F'];
            
            return (
              <div style={{ display: "grid", gap: 12 }}>
                {roundOrder.filter(round => parallelMatchesByRound[round]).map(round => (
                  <div key={round}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#999",
                      marginBottom: 8,
                      padding: "4px 8px",
                      background: "#fff",
                      borderRadius: 6,
                      border: "1px solid #dee2e6",
                      display: "inline-block"
                    }}>
                      {getRoundName(round)} ({parallelMatchesByRound[round].length} משחקים)
                    </div>
                    
                    <div style={{ display: "grid", gap: 8 }}>
                      {parallelMatchesByRound[round].map((match) => {
                        const result = getMatchResult(match);
                        return (
                          <div
                            key={match.id}
                            style={{
                              padding: 12,
                              background: "#fff",
                              borderRadius: 8,
                              border: "1px solid #e0e0e0",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 14
                            }}
                          >
                            <div style={{ color: "#666" }}>
                              {match.homePsn} vs {match.awayPsn}
                            </div>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: result.color
                            }}>
                              {result.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* פרסים */}
      {tournament && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#333" }}>
            💰 פרסי הטורניר
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16 
          }}>
            <div style={{
              padding: 20,
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              borderRadius: 12,
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥇</div>
              <div style={{ fontSize: 14, color: "#d84315", marginBottom: 4 }}>פרס ראשון</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#d84315" }}>
                {tournament.prizeFirst} ₪
              </div>
            </div>
            <div style={{
              padding: 20,
              background: "linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)",
              borderRadius: 12,
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥈</div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>פרס שני</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#666" }}>
                {tournament.prizeSecond} ₪
              </div>
            </div>
          </div>
        </div>
      )}

      {/* קישור להגשת תוצאות */}
      <div style={{
        backgroundColor: "#fff3e0",
        padding: 20,
        borderRadius: 16,
        border: "2px solid #ff9800",
        textAlign: "center"
      }}>
        <p style={{ fontSize: 16, color: "#e65100", marginBottom: 16 }}>
          רוצה להגיש תוצאת משחק?
        </p>
        <Link
          to="/bracket"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 4px 15px rgba(255, 152, 0, 0.4)"
          }}
        >
          צפה בתוצאות 📊
        </Link>
      </div>
    </div>
  );
}

