import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export type Player = {
  id: string;
  name: string;
  email?: string;
};

type DrawWheelProps = {
  players: Player[];
  spinning: boolean;
  onFinish?: (player: Player) => void;
  selectedPlayer?: Player;
};

export const DrawWheel: React.FC<DrawWheelProps> = ({
  players,
  spinning,
  onFinish,
  selectedPlayer,
}) => {
  const [rotation, setRotation] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  
  const size = 320;
  const center = size / 2;
  const radius = center - 10;
  const segmentAngle = 360 / (players.length || 1);

  useEffect(() => {
    if (!spinning || players.length === 0) return;
    
    const idx = selectedPlayer 
      ? players.findIndex(p => p.id === selectedPlayer.id)
      : Math.floor(Math.random() * players.length);
    
    if (idx === -1) return;
    
    setTargetIndex(idx);
    
    // Calculate rotation to land on target
    const spins = 6 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - idx * segmentAngle - segmentAngle / 2;
    const finalRotation = spins * 360 + targetAngle;
    setRotation(finalRotation);

    const duration = 3200;
    const timeout = setTimeout(() => {
      if (onFinish && players[idx]) {
        onFinish(players[idx]);
      }
    }, duration + 150);

    return () => clearTimeout(timeout);
  }, [spinning, selectedPlayer]);

  if (players.length === 0) {
    return (
      <div className="flex h-[320px] w-[320px] items-center justify-center rounded-full border-4 border-gray-300 bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">⚽</div>
          <div>אין שחקנים</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer/Arrow at top */}
      <div 
        className="absolute -top-4 z-20 flex items-center justify-center"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
      </div>

      {/* Wheel */}
      <motion.svg
        width={size}
        height={size}
        initial={{ rotate: 0 }}
        animate={{ rotate: rotation }}
        transition={{
          type: "tween",
          ease: [0.22, 1, 0.36, 1],
          duration: 3.2,
        }}
        className="drop-shadow-2xl"
        style={{ 
          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))'
        }}
      >
        <g transform={`translate(${center}, ${center})`}>
          {/* Border circle */}
          <circle
            cx={0}
            cy={0}
            r={radius}
            fill="none"
            stroke="#333"
            strokeWidth={4}
          />
          
          {/* Segments */}
          {players.map((player, i) => {
            const startAngle = (i * segmentAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
            const midAngle = (startAngle + endAngle) / 2;
            
            const x1 = Math.cos(startAngle) * radius;
            const y1 = Math.sin(startAngle) * radius;
            const x2 = Math.cos(endAngle) * radius;
            const y2 = Math.sin(endAngle) * radius;
            
            const largeArc = segmentAngle > 180 ? 1 : 0;
            const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // Generate colors
            const hue = (i * 360) / players.length;
            const saturation = 70 + (i % 3) * 10;
            const lightness = 55 + (i % 2) * 10;
            
            return (
              <g key={player.id}>
                <path
                  d={path}
                  fill={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.95}
                />
                
                {/* Player name */}
                <text
                  x={Math.cos(midAngle) * (radius * 0.7)}
                  y={Math.sin(midAngle) * (radius * 0.7)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={players.length > 12 ? 11 : 13}
                  fontWeight="700"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth={0.5}
                  transform={`rotate(${(i + 0.5) * segmentAngle}, ${
                    Math.cos(midAngle) * (radius * 0.7)
                  }, ${Math.sin(midAngle) * (radius * 0.7)})`}
                >
                  {player.name}
                </text>
              </g>
            );
          })}
          
          {/* Center circle */}
          <circle
            cx={0}
            cy={0}
            r={30}
            fill="#fff"
            stroke="#333"
            strokeWidth={3}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={24}
          >
            ⚽
          </text>
        </g>
      </motion.svg>

      {/* Spinning indicator */}
      {spinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 rounded-full bg-black/80 px-4 py-2 text-sm font-bold text-white"
        >
          🎲 מגריל...
        </motion.div>
      )}
    </div>
  );
};

