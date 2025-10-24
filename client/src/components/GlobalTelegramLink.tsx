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
          <div style={{ fontSize: isMobile ? 28 : 36 }}>💬</div>
          <div>
            <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#2e7d32", margin: 0 }}>
              קבוצת תמיכה ושאלות
            </h3>
            <p style={{ fontSize: isMobile ? 12 : 14, color: "#388e3c", margin: "4px 0 0 0" }}>
              הצטרף לקבוצת הטלגרם לקבלת עזרה ותמיכה
            </p>
          </div>
        </div>
        <a 
          href={globalTelegramLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: isMobile ? "12px 20px" : "12px 24px",
            background: "#4caf50",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: isMobile ? 14 : 15,
            textAlign: "center",
            display: "inline-block",
            minWidth: isMobile ? "auto" : "140px"
          }}
        >
          הצטרף 📱
        </a>
      </div>
    </div>
  );
}
