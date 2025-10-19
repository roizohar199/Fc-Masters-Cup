import React from "react";
import PlayerLogo from "./PlayerLogo";
import { getRoundName } from "../utils/rounds";
import "../styles/championsLeague.css";

interface PlayerMatchCardProps {
  match: {
    id: string;
    round: string;
    homePsn: string;
    awayPsn: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    isMyMatch: boolean;
    myRole?: "home" | "away";
  };
  result: {
    text: string;
    color: string;
  };
  isMobile: boolean;
}

export default function PlayerMatchCard({ match, result, isMobile }: PlayerMatchCardProps) {
  const isWinner = result.text.includes('ניצחון');
  const isLoss = result.text.includes('הפסד');
  const isDraw = result.text.includes('תיקו');
  const isCompleted = match.homeScore !== null && match.awayScore !== null;

  return (
    <div className="champions-league-match-card" style={{
      padding: isMobile ? 16 : 24,
      height: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      background: isWinner 
        ? "linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)"
        : isLoss 
          ? "linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(232, 62, 140, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(253, 126, 20, 0.1) 100%)",
      border: `3px solid ${
        isWinner ? "#28a745" : isLoss ? "#dc3545" : "#ffc107"
      }`,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* אפקט ניצחון/הפסד */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 6,
        background: isWinner 
          ? "linear-gradient(90deg, #28a745 0%, #20c997 100%)"
          : isLoss 
            ? "linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)"
            : "linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)"
      }} />

      {/* כותרת שלב */}
      <div className="champions-league-round-badge" style={{
        padding: "8px 16px",
        borderRadius: 20,
        fontSize: 14,
        alignSelf: "flex-start"
      }}>
        {getRoundName(match.round)}
      </div>

      {/* שחקנים */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16
      }}>
        {/* שחקן בית */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1
        }}>
          <PlayerLogo 
            playerId={`home-${match.id}`} 
            playerName={match.homePsn}
            size={isMobile ? 32 : 40}
            className="champions-league-player-logo"
          />
          <span className="champions-league-player-name" style={{
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700
          }}>
            {match.homePsn}
          </span>
          {match.myRole === 'home' && (
            <div style={{
              padding: "4px 8px",
              background: "linear-gradient(135deg, #007BFF 0%, #0056b3 100%)",
              color: "#fff",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700
            }}>
              אתה
            </div>
          )}
        </div>

        {/* VS */}
        <div className="champions-league-vs-text" style={{
          fontSize: isMobile ? 18 : 24,
          minWidth: 60,
          textAlign: "center"
        }}>
          VS
        </div>

        {/* שחקן אורח */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          flexDirection: "row-reverse"
        }}>
          <span className="champions-league-player-name" style={{
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700
          }}>
            {match.awayPsn}
          </span>
          <PlayerLogo 
            playerId={`away-${match.id}`} 
            playerName={match.awayPsn}
            size={isMobile ? 32 : 40}
            className="champions-league-player-logo"
          />
          {match.myRole === 'away' && (
            <div style={{
              padding: "4px 8px",
              background: "linear-gradient(135deg, #DC3545 0%, #a71e2a 100%)",
              color: "#fff",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700
            }}>
              אתה
            </div>
          )}
        </div>
      </div>

      {/* תוצאה */}
      {isCompleted && (
        <div className="champions-league-score" style={{
          fontSize: isMobile ? 24 : 32,
          textAlign: "center",
          marginTop: 8
        }}>
          {match.homeScore} : {match.awayScore}
        </div>
      )}

      {/* סטטוס */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 8
      }}>
        {isWinner && <span style={{ fontSize: isMobile ? 16 : 20 }}>🏆</span>}
        {isLoss && <span style={{ fontSize: isMobile ? 16 : 20 }}>💔</span>}
        {isDraw && <span style={{ fontSize: isMobile ? 16 : 20 }}>🤝</span>}
        <span className={isWinner ? 'champions-league-status-completed' : 'champions-league-status-pending'} style={{
          fontSize: isMobile ? 14 : 16,
          fontWeight: 700
        }}>
          {result.text}
        </span>
      </div>

      {/* תפקיד במשחק */}
      <div style={{
        fontSize: isMobile ? 12 : 14,
        color: "#666",
        textAlign: "center",
        marginTop: 4
      }}>
        {match.myRole === 'home' ? 'מארח' : 'אורח'} • {getRoundName(match.round)}
      </div>
    </div>
  );
}
