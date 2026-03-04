
import React, { useState } from 'react';

interface RouletteScreenProps {
  onAction: () => void;
  isDarkMode: boolean;
}

const SPIN_CATEGORIES = ["Coffee", "Music", "Nature", "Art", "Food", "Sport"];
const SPIN_COLORS = ["#f97316", "#8b5cf6", "#22c55e", "#f43f5e", "#ec4899", "#3b82f6"];

const RouletteScreen: React.FC<RouletteScreenProps> = ({ onAction, isDarkMode }) => {
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setSpinResult(null);
    
    const extra = Math.floor(Math.random() * 360) + 1080;
    const newAngle = spinAngle + extra;
    setSpinAngle(newAngle);
    
    setTimeout(() => {
      const idx = Math.floor(Math.random() * SPIN_CATEGORIES.length);
      setSpinResult(SPIN_CATEGORIES[idx]);
      setSpinning(false);
    }, 2000);
  };

  const segAngle = 360 / SPIN_CATEGORIES.length;

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="mb-4">
        <div className="font-['Syne',sans-serif] text-[22px] font-[800] tracking-[-0.5px] mb-1">
          <span className="text-[#e879f9]">Roulette</span>
        </div>
        <div className="text-[12px] font-['DM_Sans',sans-serif] text-white/40 mb-5">
          Can't decide? Let the Vibe find you.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="font-['Syne',sans-serif] text-[13px] font-[700] text-white/50 mb-[14px] tracking-[0.08em] uppercase">
          CAN'T DECIDE? SPIN IT
        </div>
        
        <div className="p-5 flex flex-col items-center gap-4 bg-white/5 backdrop-blur-[16px] border border-white/10 rounded-[20px] w-full max-w-[300px]">
          <div className="relative w-[160px] h-[160px]">
            {/* Pointer */}
            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-10 text-[18px] text-white">
              ▼
            </div>
            
            <svg 
              width="160" 
              height="160" 
              viewBox="0 0 160 160"
              style={{ 
                transform: `rotate(${spinAngle}deg)`, 
                transition: spinning ? "transform 2s cubic-bezier(0.17,0.67,0.12,0.99)" : "none" 
              }}
            >
              {SPIN_CATEGORIES.map((cat, i) => {
                const startAngle = (i * segAngle - 90) * Math.PI / 180;
                const endAngle = ((i + 1) * segAngle - 90) * Math.PI / 180;
                const x1 = 80 + 70 * Math.cos(startAngle);
                const y1 = 80 + 70 * Math.sin(startAngle);
                const x2 = 80 + 70 * Math.cos(endAngle);
                const y2 = 80 + 70 * Math.sin(endAngle);
                const midAngle = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
                const tx = 80 + 46 * Math.cos(midAngle);
                const ty = 80 + 46 * Math.sin(midAngle);
                
                return (
                  <g key={cat}>
                    <path 
                      d={`M80,80 L${x1},${y1} A70,70 0 0,1 ${x2},${y2} Z`} 
                      fill={SPIN_COLORS[i]} 
                      opacity="0.85" 
                    />
                    <text 
                      x={tx} 
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff" 
                      fontSize="9"
                      fontWeight="700" 
                      fontFamily="'Syne', sans-serif"
                      transform={`rotate(${(i + 0.5) * segAngle}, ${tx}, ${ty})`}
                    >
                      {cat}
                    </text>
                  </g>
                );
              })}
              <circle cx="80" cy="80" r="16" fill="#0d0a1e" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </svg>
          </div>
          
          {spinResult && (
            <div className="text-[13px] text-[#e879f9] font-['Syne',sans-serif] font-[700]">
              Your vibe: {spinResult} ✨
            </div>
          )}
          
          <button
            onClick={spinWheel}
            disabled={spinning}
            className="px-8 py-[10px] rounded-[50px] bg-gradient-to-br from-[#e879f9] to-[#a855f7] border-none text-white font-['Syne',sans-serif] font-[700] text-[14px] cursor-pointer shadow-[0_0_20px_rgba(232,121,249,0.4)] disabled:opacity-50"
          >
            {spinning ? "Spinning..." : "Spin ✦"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouletteScreen;
