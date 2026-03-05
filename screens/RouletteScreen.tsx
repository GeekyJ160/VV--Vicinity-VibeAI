
import React, { useState } from 'react';
import { Shuffle, MapPin, Star, Zap, Music, Coffee, Camera, Users, Sunset, Dices } from 'lucide-react';
import { SectionHeader, VibeBadge } from '../components/Icons';

interface RouletteScreenProps {
  onAction: () => void;
  isDarkMode: boolean;
}

const CATEGORIES = [
  { name: "Coffee", emoji: "☕", icon: <Coffee size={14} />, color: "#f97316", bg: "#f9731615", desc: "Find a coffee shop nearby" },
  { name: "Music", emoji: "🎵", icon: <Music size={14} />, color: "#8b5cf6", bg: "#8b5cf615", desc: "Live music & concerts" },
  { name: "Outdoors", emoji: "🌳", icon: <Sunset size={14} />, color: "#22c55e", bg: "#22c55e15", desc: "Parks, trails & nature" },
  { name: "Art", emoji: "🎨", icon: <Star size={14} />, color: "#f43f5e", bg: "#f43f5e15", desc: "Galleries & street art" },
  { name: "Food", emoji: "🍜", icon: <Zap size={14} />, color: "#ec4899", bg: "#ec489915", desc: "Local restaurants & eats" },
  { name: "Sport", emoji: "⚽", icon: <Users size={14} />, color: "#3b82f6", bg: "#3b82f615", desc: "Activities & sports" },
  { name: "Photo", emoji: "📷", icon: <Camera size={14} />, color: "#06b6d4", bg: "#06b6d415", desc: "Photography spots" },
  { name: "Social", emoji: "🎉", icon: <Users size={14} />, color: "#a855f7", bg: "#a855f715", desc: "Meet & socialize" },
];

const COLORS = CATEGORIES.map(c => c.color);

const RouletteScreen: React.FC<RouletteScreenProps> = ({ onAction, isDarkMode }) => {
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinResult, setSpinResult] = useState<typeof CATEGORIES[0] | null>(null);
  const [history, setHistory] = useState<typeof CATEGORIES[0][]>([]);
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setSpinResult(null);

    const extra = Math.floor(Math.random() * 360) + 1440;
    const newAngle = spinAngle + extra;
    setSpinAngle(newAngle);

    setTimeout(() => {
      const idx = Math.floor(Math.random() * CATEGORIES.length);
      const result = CATEGORIES[idx];
      setSpinResult(result);
      setHistory(prev => [result, ...prev.slice(0, 4)]);
      setSpinning(false);
    }, 2500);
  };

  const segAngle = 360 / CATEGORIES.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-3 pb-24 space-y-5">
          {/* Header */}
          <SectionHeader
            title="Vibe Roulette"
            subtitle="Let the universe decide"
            icon={<Dices size={16} />}
          />

          {/* ─── Wheel Section ───────────────────────────────── */}
          <div
            className="rounded-[24px] p-6 flex flex-col items-center gap-5 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Glow effect behind wheel */}
            <div
              className="absolute rounded-full blur-3xl opacity-10 pointer-events-none"
              style={{
                width: 200, height: 200,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -70%)',
                background: spinning ? '#e879f9' : '#a855f7',
                transition: 'background 0.5s ease',
              }}
            />

            {/* Label */}
            <div className="text-[10px] font-[800] uppercase tracking-[0.2em] text-white/30">
              {spinning ? "SPINNING..." : spinResult ? "YOUR VIBE IS" : "SPIN TO DISCOVER"}
            </div>

            {/* Wheel container */}
            <div className="relative" style={{ width: 220, height: 220 }}>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center">
                <div
                  className="w-4 h-4 rotate-180"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.7))',
                    filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))',
                  }}
                />
              </div>

              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: spinning
                    ? '0 0 40px rgba(232,121,249,0.5), 0 0 80px rgba(168,85,247,0.2)'
                    : '0 0 20px rgba(232,121,249,0.2)',
                  transition: 'box-shadow 0.5s ease',
                }}
              />

              {/* SVG Wheel */}
              <svg
                width="220" height="220"
                style={{
                  transform: `rotate(${spinAngle}deg)`,
                  transition: spinning
                    ? 'transform 2.5s cubic-bezier(0.17,0.67,0.12,0.99)'
                    : 'none',
                }}
              >
                {CATEGORIES.map((cat, i) => {
                  const startAngle = (i * segAngle - 90) * Math.PI / 180;
                  const endAngle = ((i + 1) * segAngle - 90) * Math.PI / 180;
                  const x1 = 110 + 100 * Math.cos(startAngle);
                  const y1 = 110 + 100 * Math.sin(startAngle);
                  const x2 = 110 + 100 * Math.cos(endAngle);
                  const y2 = 110 + 100 * Math.sin(endAngle);
                  const midAngle = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
                  const tx = 110 + 65 * Math.cos(midAngle);
                  const ty = 110 + 65 * Math.sin(midAngle);
                  const ex = 110 + 85 * Math.cos(midAngle);
                  const ey = 110 + 85 * Math.sin(midAngle);

                  return (
                    <g key={cat.name}>
                      <path
                        d={`M110,110 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                        fill={cat.color}
                        opacity={0.85}
                        stroke="rgba(0,0,0,0.2)"
                        strokeWidth="1"
                      />
                      <text
                        x={ex} y={ey}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize="14"
                        transform={`rotate(${(i + 0.5) * segAngle}, ${ex}, ${ey})`}
                      >
                        {cat.emoji}
                      </text>
                      <text
                        x={tx} y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.85)"
                        fontSize="7"
                        fontWeight="700"
                        fontFamily="'DM Sans', sans-serif"
                        transform={`rotate(${(i + 0.5) * segAngle}, ${tx}, ${ty})`}
                      >
                        {cat.name}
                      </text>
                    </g>
                  );
                })}

                {/* Center circle */}
                <circle cx="110" cy="110" r="22" fill="#0d0a1e" />
                <circle cx="110" cy="110" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="110" y="110" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.8)" fontSize="16">⚡</text>
              </svg>
            </div>

            {/* Result */}
            {spinResult && !spinning && (
              <div
                className="w-full rounded-2xl p-4 flex items-center gap-4 vv-bounce-in"
                style={{ background: `${spinResult.color}15`, border: `1px solid ${spinResult.color}30` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${spinResult.color}20` }}
                >
                  {spinResult.emoji}
                </div>
                <div>
                  <div
                    className="font-['Syne',sans-serif] font-[800] text-[16px]"
                    style={{ color: spinResult.color }}
                  >
                    {spinResult.name}
                  </div>
                  <div className="text-white/50 text-[12px] font-medium">{spinResult.desc}</div>
                </div>
                <button
                  onClick={onAction}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-[700] shrink-0"
                  style={{ background: `${spinResult.color}20`, border: `1px solid ${spinResult.color}30`, color: spinResult.color }}
                >
                  <MapPin size={12} />
                  Find
                </button>
              </div>
            )}

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={spinning}
              className="px-10 py-4 rounded-2xl font-['Syne',sans-serif] font-[800] text-[15px] text-white uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: spinning
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #e879f9, #a855f7)',
                boxShadow: spinning ? 'none' : '0 4px 20px rgba(232,121,249,0.4)',
              }}
            >
              {spinning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Spinning...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shuffle size={16} />
                  Spin Vibe
                </div>
              )}
            </button>
          </div>

          {/* ─── Categories Grid ──────────────────────────── */}
          <div>
            <h3 className="font-['Syne',sans-serif] font-[700] text-[13px] text-white/50 uppercase tracking-widest mb-3">Or Pick Manually</h3>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onMouseEnter={() => setHoveredCat(i)}
                  onMouseLeave={() => setHoveredCat(null)}
                  onClick={() => { setSpinResult(cat); setHistory(prev => [cat, ...prev.slice(0, 4)]); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: spinResult?.name === cat.name ? `${cat.color}20` : 'rgba(255,255,255,0.04)',
                    border: spinResult?.name === cat.name ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: spinResult?.name === cat.name ? `0 0 12px ${cat.color}25` : 'none',
                  }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[10px] font-[700] text-white/60">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── History ─────────────────────────────────── */}
          {history.length > 0 && (
            <div>
              <h3 className="font-['Syne',sans-serif] font-[700] text-[13px] text-white/50 uppercase tracking-widest mb-3">Recent Spins</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {history.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-[11px] font-[600]" style={{ color: item.color }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Map CTA ──────────────────────────────────── */}
          <div
            className="rounded-[20px] p-5 flex items-center gap-4 relative overflow-hidden"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <MapPin size={22} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-['Syne',sans-serif] font-[700] text-white text-[13px] mb-0.5">Explore on Map</p>
              <p className="text-white/35 text-[11px] font-medium">See all nearby vibes & events</p>
            </div>
            <button
              onClick={onAction}
              className="px-4 py-2.5 rounded-xl text-[11px] font-[700] shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }}
            >
              Open
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RouletteScreen;
