import React, { useEffect, useState } from "react";
import { api } from "../api";

interface PlayerTournamentStatusProps {
  tournament: any;
  myMatches: any[];
  isMobile: boolean;
}

export function PlayerTournamentStatus({ tournament, myMatches, isMobile }: PlayerTournamentStatusProps) {
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournament?.id) {
      loadRegistrationStatus();
    }
  }, [tournament?.id]);

  async function loadRegistrationStatus() {
    try {
      const result = await api(`/api/tournament-registrations/${tournament.id}/summary`);
      setRegistrationStatus(result);
    } catch (error) {
      console.error("Error loading registration status:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !registrationStatus) {
    return null;
  }

  const isRegistered = registrationStatus.myState === "registered";
  const hasMatches = myMatches && myMatches.length > 0;
  const isSelected = hasMatches;

  // אם המשתמש נבחר לטורניר (יש לו משחקים)
  if (isSelected) {
    return (
      <div style={{
        backgroundColor: "#e8f5e8",
        padding: isMobile ? 16 : 20,
        borderRadius: isMobile ? 12 : 16,
        border: "2px solid #4caf50",
        marginBottom: isMobile ? 16 : 24
      }}>
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center", 
          gap: isMobile ? 16 : 12, 
          justifyContent: "space-between" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
            <div style={{ fontSize: isMobile ? 28 : 36 }}>🎯</div>
            <div>
              <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#2e7d32", margin: 0 }}>
                נבחרת לטורניר!
              </h3>
              <p style={{ fontSize: isMobile ? 12 : 14, color: "#388e3c", margin: "4px 0 0 0" }}>
                מזל טוב! נבחרת להשתתף בטורניר. יש לך {myMatches.length} משחקים
              </p>
            </div>
          </div>
          <div style={{
            padding: isMobile ? "8px 16px" : "10px 20px",
            background: "#4caf50",
            color: "#fff",
            borderRadius: 8,
            fontSize: isMobile ? 12 : 14,
            fontWeight: 700,
            textAlign: "center"
          }}>
            ✅ נבחר
          </div>
        </div>
      </div>
    );
  }


  // אם המשתמש לא נרשם
  return (
    <div style={{
      backgroundColor: "#f3e5f5",
      padding: isMobile ? 16 : 20,
      borderRadius: isMobile ? 12 : 16,
      border: "2px solid #9c27b0",
      marginBottom: isMobile ? 16 : 24
    }}>
      <div style={{ 
        display: "flex", 
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center", 
        gap: isMobile ? 16 : 12, 
        justifyContent: "space-between" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
          <div style={{ fontSize: isMobile ? 28 : 36 }}>📝</div>
          <div>
            <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#7b1fa2", margin: 0 }}>
              לא נרשמת עדיין
            </h3>
            <p style={{ fontSize: isMobile ? 12 : 14, color: "#8e24aa", margin: "4px 0 0 0" }}>
              לחץ על "אני בפנים!" כדי להביע עניין בטורניר
            </p>
          </div>
        </div>
        <div style={{
          padding: isMobile ? "8px 16px" : "10px 20px",
          background: "#9c27b0",
          color: "#fff",
          borderRadius: 8,
          fontSize: isMobile ? 12 : 14,
          fontWeight: 700,
          textAlign: "center"
        }}>
          ❌ לא נרשם
        </div>
      </div>
    </div>
  );
}
