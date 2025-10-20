import React from "react";
import PlayerLogo from "./PlayerLogo";

interface Player {
  id: string;
  psn: string;
  displayName: string;
  email?: string;
}

interface PlayersListProps {
  players: Player[];
  isMobile?: boolean;
}

export default function PlayersList({ players, isMobile = false }: PlayersListProps) {
  // מיון השחקנים לפי שם PSN
  const sortedPlayers = [...players].sort((a, b) => a.psn.localeCompare(b.psn));

  return (
    <div
      style={{
        width: isMobile ? "100%" : "300px",
        minHeight: "400px",
        background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? 16 : 20,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        border: "2px solid #FFD700",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* רקע דקורטיבי */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)"
        }}
      />

      {/* כותרת */}
      <div
        style={{
          textAlign: "center",
          marginBottom: isMobile ? 16 : 20,
          paddingBottom: isMobile ? 12 : 16,
          borderBottom: "2px solid #e9ecef"
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <span style={{ fontSize: isMobile ? 20 : 24 }}>👥</span>
          {isMobile ? "16 שחקנים" : "16 השחקנים המשתתפים"}
        </h3>
        <p
          style={{
            fontSize: isMobile ? 12 : 14,
            color: "#666",
            margin: "8px 0 0 0",
            fontWeight: 500
          }}
        >
          {isMobile ? "בטורניר" : "בטורניר הנוכחי"}
        </p>
      </div>

      {/* רשימת שחקנים */}
      <div
        className="players-list-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 8 : 10,
          maxHeight: isMobile ? "300px" : "500px",
          overflowY: "auto",
          paddingRight: 4
        }}
      >
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 12,
              padding: isMobile ? "10px 12px" : "12px 16px",
              background: index % 2 === 0 
                ? "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)" 
                : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              borderRadius: isMobile ? 8 : 10,
              border: "1px solid #e9ecef",
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(4px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 215, 0, 0.2)";
              e.currentTarget.style.borderColor = "#FFD700";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#e9ecef";
            }}
          >
            {/* מספר סידורי */}
            <div
              style={{
                minWidth: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)"
              }}
            >
              {index + 1}
            </div>

            {/* לוגו שחקן */}
            <PlayerLogo
              playerId={player.id}
              playerName={player.psn}
              size={isMobile ? 32 : 36}
              className="player-logo"
            />

            {/* פרטי שחקן */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700,
                  color: "#333",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {player.psn}
              </div>
              {player.displayName && player.displayName !== player.psn && (
                <div
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {player.displayName}
                </div>
              )}
            </div>

            {/* סטטוס (אופציונלי) */}
            <div
              style={{
                width: isMobile ? 8 : 10,
                height: isMobile ? 8 : 10,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                boxShadow: "0 0 8px rgba(40, 167, 69, 0.4)"
              }}
            />
          </div>
        ))}
      </div>

      {/* סטטיסטיקות */}
      <div
        style={{
          marginTop: isMobile ? 12 : 16,
          padding: isMobile ? 10 : 12,
          background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
          borderRadius: isMobile ? 8 : 10,
          border: "1px solid #bbdefb"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: isMobile ? 12 : 13,
            fontWeight: 600,
            color: "#1976d2"
          }}
        >
          <span>סה"כ שחקנים:</span>
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800 }}>
            {players.length}/16
          </span>
        </div>
        {players.length < 16 && (
          <div
            style={{
              fontSize: isMobile ? 10 : 11,
              color: "#ff9800",
              marginTop: 4,
              textAlign: "center"
            }}
          >
            ⚠️ חסרים {16 - players.length} שחקנים
          </div>
        )}
      </div>

      {/* כיתוב תחתון */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: isMobile ? 10 : 11,
          color: "#999",
          fontWeight: 500
        }}
      >
        FC Masters Cup
      </div>
    </div>
  );
}
