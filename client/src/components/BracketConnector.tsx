import React from "react";

interface BracketConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  round: string;
}

export default function BracketConnector({ fromX, fromY, toX, toY, round }: BracketConnectorProps) {
  // צבעי החיבור לפי שלב
  const getConnectorColor = (round: string) => {
    switch (round) {
      case 'R16': return '#667eea';
      case 'QF': return '#f093fb';
      case 'SF': return '#4facfe';
      case 'F': return '#43e97b';
      default: return '#667eea';
    }
  };

  // חישוב נקודות הביניים לקו מעוקל
  const midX = (fromX + toX) / 2;
  const midY1 = fromY;
  const midY2 = toY;

  // נתיב SVG עם עקומות
  const pathData = `M ${fromX} ${fromY} 
                   Q ${midX} ${midY1} ${midX} ${(fromY + toY) / 2}
                   Q ${midX} ${midY2} ${toX} ${toY}`;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1
      }}
    >
      <defs>
        <linearGradient id={`gradient-${round}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={getConnectorColor(round)} stopOpacity="0.8" />
          <stop offset="50%" stopColor={getConnectorColor(round)} stopOpacity="0.6" />
          <stop offset="100%" stopColor={getConnectorColor(round)} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* הקו הראשי */}
      <path
        d={pathData}
        stroke={`url(#gradient-${round})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* חץ בקצה */}
      <polygon
        points={`${toX-8},${toY-4} ${toX},${toY} ${toX-8},${toY+4}`}
        fill={getConnectorColor(round)}
        stroke={getConnectorColor(round)}
        strokeWidth="1"
      />
      
      {/* נקודה במרכז */}
      <circle
        cx={midX}
        cy={(fromY + toY) / 2}
        r="4"
        fill={getConnectorColor(round)}
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}
