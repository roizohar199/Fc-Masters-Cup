import React from "react";

interface BracketConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  round: string;
}

export default function BracketConnector({ fromX, fromY, toX, toY, round }: BracketConnectorProps) {
  // צבעי החיבור לפי שלב - עכשיו עם זהב
  const getConnectorColor = (round: string) => {
    switch (round) {
      case 'R16': return '#FFD700';
      case 'QF': return '#FFA500';
      case 'SF': return '#FFD700';
      case 'F': return '#FFD700';
      default: return '#FFD700';
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
          <stop offset="0%" stopColor={getConnectorColor(round)} stopOpacity="0.9" />
          <stop offset="50%" stopColor={getConnectorColor(round)} stopOpacity="0.7" />
          <stop offset="100%" stopColor={getConnectorColor(round)} stopOpacity="0.9" />
        </linearGradient>
        <filter id={`glow-${round}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* הקו הראשי */}
      <path
        d={pathData}
        stroke={`url(#gradient-${round})`}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${round})`}
        style={{
          animation: `connectorFlow 2s ease-in-out infinite`
        }}
      />
      
      {/* חץ בקצה */}
      <polygon
        points={`${toX-10},${toY-5} ${toX},${toY} ${toX-10},${toY+5}`}
        fill={getConnectorColor(round)}
        stroke="#fff"
        strokeWidth="2"
        filter={`url(#glow-${round})`}
      />
      
      {/* נקודה במרכז */}
      <circle
        cx={midX}
        cy={(fromY + toY) / 2}
        r="6"
        fill={getConnectorColor(round)}
        stroke="#fff"
        strokeWidth="3"
        filter={`url(#glow-${round})`}
        style={{
          animation: `connectorPulse 3s ease-in-out infinite`
        }}
      />
      
      <style jsx>{`
        @keyframes connectorFlow {
          0%, 100% {
            stroke-dasharray: 0, 100;
          }
          50% {
            stroke-dasharray: 20, 80;
          }
        }
        
        @keyframes connectorPulse {
          0%, 100% {
            r: 6;
            opacity: 0.8;
          }
          50% {
            r: 8;
            opacity: 1;
          }
        }
      `}</style>
    </svg>
  );
}
