import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import PlayerDashboardChampions from "../components/PlayerDashboardChampions";
import { TournamentSignupCard } from "../components/TournamentSignupCard";
import { NotificationBanner } from "../components/NotificationBanner";
import { getRoundName } from "../utils/rounds";
import "../styles/championsLeague.css";
import { PlayerTournamentStatus } from "../components/PlayerTournamentStatus";
import { PlayerNotifications } from "../components/PlayerNotifications";

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { tournamentId } = useStore();

  // זיהוי מובייל
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        
        // אם יש tournamentId ב-store, נחפש את הטורניר הספציפי
        if (tournamentId && tournamentId !== "default") {
          selectedTournament = tournaments.find(t => t.id === tournamentId);
          console.log("🎯 חיפוש טורניר לפי ID:", tournamentId);
          console.log("🎯 טורניר שנמצא:", selectedTournament);
        }
        
        
        // אם עדיין לא מצאנו, ניקח את הטורניר האחרון
        if (!selectedTournament) {
          selectedTournament = tournaments[tournaments.length - 1];
          console.log("🎯 לא נמצא טורניר ספציפי, לוקח את האחרון:", selectedTournament);
        }
        
        console.log("🎯 הטורניר שנבחר:", selectedTournament);
        setTournament(selectedTournament);

        // טעינת משחקים בוטלה עם הסרת מערכת הברקט
        setAllMatches([]);
        setMyMatches([]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

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
    <div style={{ padding: isMobile ? "8px" : "0" }}>
      {/* הודעות */}
      <NotificationBanner />
      
      {/* כרטיס הרשמה לטורניר - תמיד מוצג */}
      <div style={{ marginBottom: isMobile ? 16 : 32 }}>
        <TournamentSignupCard tournamentId={tournament?.id || "default"} />
      </div>

      {/* Telegram Group Button */}
      <div style={{ 
        display: "grid", 
        gap: 20, 
        marginBottom: isMobile ? 16 : 32, 
        paddingBottom: isMobile ? 16 : 24, 
        borderBottom: "2px solid #e0e0e0" 
      }}>
        <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#333", margin: 0, textAlign: "right" }}>
          📱 קבוצת טלגרם
        </h2>
        
        <div style={{ textAlign: "center" }}>
          <p style={{ 
            fontSize: isMobile ? 14 : 15, 
            color: "#666", 
            marginBottom: 20, 
            lineHeight: 1.5,
            textAlign: "right"
          }}>
            הצטרף לקבוצת הטלגרם שלנו לקבלת עדכונים, הודעות חשובות וקשר עם שחקנים אחרים
          </p>
          
          <a
            href="https://t.me/+elbxvwU9fLE1YTg8"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              width: "100%",
              padding: isMobile ? "14px 20px" : "16px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #0088cc 0%, #00a8ff 100%)",
              color: "#fff",
              fontSize: isMobile ? 15 : 16,
              fontWeight: 700,
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 136, 204, 0.4)",
              transition: "all 0.3s",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 136, 204, 0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 136, 204, 0.4)";
            }}
          >
            <span style={{ fontSize: isMobile ? 18 : 20 }}>📱</span>
            הצטרף לקבוצת טלגרם
          </a>
        </div>
      </div>

      {/* רכיב חדש בסגנון ליגת האלופות */}
      <PlayerDashboardChampions
        playerInfo={playerInfo}
        tournament={tournament}
        myMatches={myMatches}
        allMatches={allMatches}
        isMobile={isMobile}
        getMyOpponents={getMyOpponents}
        getParallelMatches={getParallelMatches}
        getMatchResult={getMatchResult}
      />

      
      {/* סטטוס הרישום וההגרלה */}
      <PlayerTournamentStatus 
        tournament={tournament}
        myMatches={myMatches}
        isMobile={isMobile}
      />
      
      {/* הודעות למשתמש */}
      <PlayerNotifications isMobile={isMobile} />
      
      
      {/* הגרסה הישנה (מוסתרת) */}
      <div style={{ display: "none" }}>
        <div style={{ display: "grid", gap: isMobile ? 16 : 24, direction: "rtl", padding: isMobile ? "0 12px" : 0 }}>
      {/* כרטיס ברכה */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: isMobile ? 16 : 32,
        borderRadius: isMobile ? 12 : 16,
        color: "#fff",
        boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
        overflow: "hidden",
        textAlign: "center"
      }}>
        <h2 style={{ 
          fontSize: isMobile ? 18 : 32, 
          fontWeight: 700, 
          marginBottom: isMobile ? 8 : 12, 
          lineHeight: 1.3,
          wordBreak: "break-word",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center"
        }}>
          שלום, {playerInfo?.email}! ⚽
        </h2>
        <p style={{ 
          fontSize: isMobile ? 13 : 16, 
          opacity: 0.9,
          lineHeight: 1.4,
          wordBreak: "break-word",
          textAlign: "center"
        }}>
          ברוך הבא לאזור השחקנים של FC Masters Cup
        </p>
      </div>

      {/* זיכוי פרס שני */}
      {playerInfo && playerInfo.secondPrizeCredit > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          boxShadow: "0 8px 24px rgba(255, 215, 0, 0.3)",
          border: isMobile ? "2px solid #ffa000" : "3px solid #ffa000"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16 }}>
            <div style={{ fontSize: isMobile ? 36 : 48 }}>🎁</div>
            <div>
              <h3 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: "#d84315", margin: 0 }}>
                יש לך זיכוי פרס שני!
              </h3>
              <p style={{ fontSize: isMobile ? 14 : 18, color: "#5d4037", margin: "8px 0 0 0" }}>
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
          padding: isMobile ? 16 : 20,
          borderRadius: isMobile ? 12 : 16,
          border: "2px solid #2196F3"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
            <div style={{ fontSize: isMobile ? 28 : 36 }}>⏰</div>
            <div>
              <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#1976D2", margin: 0 }}>
                הטורניר הבא
              </h3>
              <p style={{ fontSize: isMobile ? 14 : 16, color: "#1565C0", margin: "8px 0 0 0" }}>
                {tournament.nextTournamentDate}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* סטטוס הטורניר הנוכחי */}
      {getCurrentRound() && (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          color: "#fff",
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16 }}>
            <div style={{ fontSize: isMobile ? 36 : 48 }}>🎯</div>
            <div>
              <h3 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, margin: 0 }}>
                השלב הנוכחי שלך
              </h3>
              <p style={{ fontSize: isMobile ? 14 : 16, opacity: 0.9, margin: "4px 0 0 0" }}>
                {getCurrentRound()}
              </p>
            </div>
          </div>
          
          {/* סטטיסטיקות מהירות */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fit, minmax(120px, 1fr))", 
            gap: isMobile ? 10 : 16,
            marginTop: isMobile ? 12 : 20
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: isMobile ? 12 : 16,
              borderRadius: isMobile ? 8 : 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>{myMatches.length}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.8 }}>משחקים שלי</div>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: isMobile ? 12 : 16,
              borderRadius: isMobile ? 8 : 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>{getMyOpponents().length}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.8 }}>יריבים</div>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: isMobile ? 12 : 16,
              borderRadius: isMobile ? 8 : 12,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>{getParallelMatches().length}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.8 }}>משחקים מקבילים</div>
            </div>
          </div>
        </div>
      )}

      {/* היריבים שלי */}
      {getMyOpponents().length > 0 && (
        <div style={{
          backgroundColor: "#fff",
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: isMobile ? 12 : 16, color: "#333" }}>
            ⚔️ היריבים שלך בטורניר
          </h3>
          <div style={{ display: "grid", gap: isMobile ? 10 : 12 }}>
            {getMyOpponents().map((opponent, idx) => (
              <div
                key={idx}
                style={{
                  padding: isMobile ? 12 : 16,
                  background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
                  borderRadius: isMobile ? 8 : 10,
                  border: "2px solid #f0f0f0",
                  fontSize: isMobile ? 14 : 16,
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
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          border: isMobile ? "2px solid #667eea" : "3px solid #667eea"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 20 }}>
            <div style={{ fontSize: isMobile ? 24 : 32 }}>🏆</div>
            <h3 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, margin: 0, color: "#333" }}>
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
              <div style={{ display: "grid", gap: isMobile ? 16 : 20 }}>
                {roundOrder.filter(round => matchesByRound[round]).map(round => (
                  <div key={round}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 6 : 8,
                      marginBottom: isMobile ? 10 : 12,
                      padding: isMobile ? "6px 12px" : "8px 16px",
                      background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                      borderRadius: isMobile ? 6 : 8,
                      border: "1px solid #667eea30"
                    }}>
                      <div style={{ fontSize: isMobile ? 14 : 16 }}>🎯</div>
                      <h4 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, margin: 0, color: "#667eea" }}>
                        {getRoundName(round)}
                      </h4>
                    </div>
                    
                    <div style={{ display: "grid", gap: isMobile ? 10 : 12 }}>
                      {matchesByRound[round].map((match) => {
                        const result = getMatchResult(match);
                        const isWinner = result.text.includes('ניצחון');
                        const isLoss = result.text.includes('הפסד');
                        const isDraw = result.text.includes('תיקו');
                        
                        return (
                          <div
                            key={match.id}
                            style={{
                              padding: isMobile ? 14 : 20,
                              background: isWinner 
                                ? "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)"
                                : isLoss 
                                  ? "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)"
                                  : "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                              borderRadius: isMobile ? 10 : 12,
                              border: `2px solid ${
                                isWinner ? "#28a745" : isLoss ? "#dc3545" : "#ffc107"
                              }`,
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems: isMobile ? "stretch" : "center",
                              gap: isMobile ? 12 : 0,
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
                                fontSize: isMobile ? 15 : 18, 
                                fontWeight: 600, 
                                color: "#333",
                                marginBottom: 4
                              }}>
                                {match.homePsn} vs {match.awayPsn}
                              </div>
                              <div style={{ 
                                fontSize: isMobile ? 11 : 12, 
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
                              justifyContent: isMobile ? "space-between" : "flex-end",
                              gap: isMobile ? 8 : 12
                            }}>
                              {match.homeScore !== null && match.awayScore !== null && (
                                <div style={{
                                  fontSize: isMobile ? 16 : 20,
                                  fontWeight: 700,
                                  color: "#333",
                                  padding: isMobile ? "6px 12px" : "8px 16px",
                                  background: "rgba(255, 255, 255, 0.8)",
                                  borderRadius: isMobile ? 6 : 8
                                }}>
                                  {match.homeScore}:{match.awayScore}
                                </div>
                              )}
                              <div style={{
                                fontSize: isMobile ? 14 : 16,
                                fontWeight: 700,
                                color: result.color,
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? 4 : 6
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
          padding: isMobile ? 16 : 20,
          borderRadius: isMobile ? 10 : 12,
          border: "1px solid #e9ecef"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, marginBottom: isMobile ? 12 : 16 }}>
            <div style={{ fontSize: isMobile ? 18 : 20 }}>📊</div>
            <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, margin: 0, color: "#666" }}>
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
              <div style={{ display: "grid", gap: isMobile ? 10 : 12 }}>
                {roundOrder.filter(round => parallelMatchesByRound[round]).map(round => (
                  <div key={round}>
                    <div style={{
                      fontSize: isMobile ? 12 : 14,
                      fontWeight: 600,
                      color: "#999",
                      marginBottom: isMobile ? 6 : 8,
                      padding: isMobile ? "3px 6px" : "4px 8px",
                      background: "#fff",
                      borderRadius: isMobile ? 4 : 6,
                      border: "1px solid #dee2e6",
                      display: "inline-block"
                    }}>
                      {getRoundName(round)} ({parallelMatchesByRound[round].length} משחקים)
                    </div>
                    
                    <div style={{ display: "grid", gap: isMobile ? 6 : 8 }}>
                      {parallelMatchesByRound[round].map((match) => {
                        const result = getMatchResult(match);
                        return (
                          <div
                            key={match.id}
                            style={{
                              padding: isMobile ? 10 : 12,
                              background: "#fff",
                              borderRadius: isMobile ? 6 : 8,
                              border: "1px solid #e0e0e0",
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems: isMobile ? "flex-start" : "center",
                              gap: isMobile ? 6 : 0,
                              fontSize: isMobile ? 13 : 14
                            }}
                          >
                            <div style={{ color: "#666" }}>
                              {match.homePsn} vs {match.awayPsn}
                            </div>
                            <div style={{
                              fontSize: isMobile ? 13 : 14,
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
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: isMobile ? 12 : 16, color: "#333" }}>
            💰 פרסי הטורניר
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: isMobile ? 12 : 16 
          }}>
            <div style={{
              padding: isMobile ? 16 : 20,
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              borderRadius: isMobile ? 10 : 12,
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
            }}>
              <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: isMobile ? 6 : 8 }}>🥇</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: "#d84315", marginBottom: 4 }}>פרס ראשון</div>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#d84315" }}>
                {tournament.prizeFirst} ₪
              </div>
            </div>
            <div style={{
              padding: isMobile ? 16 : 20,
              background: "linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)",
              borderRadius: isMobile ? 10 : 12,
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: isMobile ? 6 : 8 }}>🥈</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: "#666", marginBottom: 4 }}>פרס שני</div>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#666" }}>
                {tournament.prizeSecond} ₪
              </div>
            </div>
          </div>
        </div>
      )}

      {/* קישור תוצאות הוסר */}
    </div>
      </div>
    </div>
  );
}

