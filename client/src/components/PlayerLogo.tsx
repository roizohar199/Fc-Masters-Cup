import React from "react";

interface PlayerLogoProps {
  playerId: string;
  playerName?: string;
  size?: number;
  className?: string;
}

export default function PlayerLogo({ playerId, playerName, size = 32, className = "" }: PlayerLogoProps) {
  // יצירת לוגו ייחודי לכל שחקן בהתבסס על ה-ID שלו
  const getLogoData = (id: string, name?: string) => {
    const hash = id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      { bg: '#FF6B6B', text: '#FFF' }, // אדום
      { bg: '#4ECDC4', text: '#FFF' }, // טורקיז
      { bg: '#45B7D1', text: '#FFF' }, // כחול
      { bg: '#96CEB4', text: '#FFF' }, // ירוק
      { bg: '#FECA57', text: '#000' }, // צהוב
      { bg: '#FF9FF3', text: '#FFF' }, // ורוד
      { bg: '#54A0FF', text: '#FFF' }, // כחול בהיר
      { bg: '#5F27CD', text: '#FFF' }, // סגול
      { bg: '#00D2D3', text: '#FFF' }, // טורקיז בהיר
      { bg: '#FF9F43', text: '#FFF' }, // כתום
      { bg: '#10AC84', text: '#FFF' }, // ירוק כהה
      { bg: '#EE5A24', text: '#FFF' }, // אדום כהה
      { bg: '#0984E3', text: '#FFF' }, // כחול כהה
      { bg: '#A29BFE', text: '#FFF' }, // סגול בהיר
      { bg: '#FD79A8', text: '#FFF' }, // ורוד בהיר
      { bg: '#FDCB6E', text: '#000' }, // צהוב בהיר
    ];
    
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];
    
    // יצירת ראשי תיבות מהשם
    let initials = 'FC';
    if (name) {
      const words = name.split(' ');
      if (words.length >= 2) {
        initials = words[0][0] + words[1][0];
      } else if (words.length === 1) {
        initials = words[0].substring(0, 2);
      }
    }
    
    return {
      color,
      initials: initials.toUpperCase(),
      pattern: Math.abs(hash) % 4 // 4 דפוסים שונים
    };
  };

  const logoData = getLogoData(playerId, playerName);

  const getPatternStyle = (pattern: number, color: typeof logoData.color) => {
    switch (pattern) {
      case 0: // עיגול פשוט
        return {
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
          borderRadius: '50%'
        };
      case 1: // ריבוע עם פינות מעוגלות
        return {
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
          borderRadius: '20%'
        };
      case 2: // משושה
        return {
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
          borderRadius: '30%',
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
        };
      case 3: // יהלום
        return {
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
          borderRadius: '0%',
          transform: 'rotate(45deg)'
        };
      default:
        return {
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`,
          borderRadius: '50%'
        };
    }
  };

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: logoData.color.text,
        fontSize: size * 0.4,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        ...getPatternStyle(logoData.pattern, logoData.color)
      }}
    >
      {/* אפקט ברק */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
        animation: 'logoShine 3s ease-in-out infinite'
      }} />
      
      <span style={{
        position: 'relative',
        zIndex: 1,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        transform: logoData.pattern === 3 ? 'rotate(-45deg)' : 'none'
      }}>
        {logoData.initials}
      </span>
      
      <style jsx>{`
        @keyframes logoShine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}
