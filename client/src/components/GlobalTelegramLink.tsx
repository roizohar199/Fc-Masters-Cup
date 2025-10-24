import React, { useEffect, useState } from "react";
import { api } from "../api";

interface GlobalTelegramLinkProps {
  isMobile: boolean;
}

export function GlobalTelegramLink({ isMobile }: GlobalTelegramLinkProps) {
  // קישור קבוע לטלגרם
  const globalTelegramLink = "https://t.me/+elbxvwU9fLE1YTg8";

  return (
    <div style={{
      backgroundColor: "#e3f2fd",
      padding: isMobile ? 16 : 20,
      borderRadius: isMobile ? 12 : 16,
      border: "2px solid #2196f3",
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
          <div style={{ fontSize: isMobile ? 28 : 36 }}>🏆</div>
          <div>
            <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#1565c0", margin: 0 }}>
              קבוצת הטורניר
            </h3>
            <p style={{ fontSize: isMobile ? 12 : 14, color: "#1976d2", margin: "4px 0 0 0" }}>
              הצטרף לקבוצת הטלגרם של הטורניר לתשלום ומידע
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            console.log("כפתור נלחץ - פותח קישור לטלגרם");
            window.open(globalTelegramLink, "_blank");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#1E90FF",
            color: "#fff",
            padding: isMobile ? "10px 16px" : "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            border: "none",
            transition: "0.3s",
            fontSize: isMobile ? 14 : 15,
            minWidth: isMobile ? "auto" : "140px",
            cursor: "pointer"
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0B72E7")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#1E90FF")}
        >
          📅 הצטרף לטורניר
        </button>
      </div>
    </div>
  );
}
