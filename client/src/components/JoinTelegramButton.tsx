import React from 'react';

export default function JoinTelegramButton() {
  const url = "https://t.me/+elbxvwU9fLE1YTg8";
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="הצטרפות לקבוצת טלגרם"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "rgb(30,144,255)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "8px",
        fontWeight: "700",
        border: "none",
        fontSize: "15px",
        minWidth: "180px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform .15s ease"
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* אייקון יוניקוד קטן של טלגרם (לא חובה) */}
      <span role="img" aria-hidden="true">📣</span>
      הצטרפות לקבוצת טלגרם
    </a>
  );
}
