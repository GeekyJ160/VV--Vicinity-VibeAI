
import React from 'react';

// ─── Navigation Icons ───────────────────────────────────────────
export const MapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

export const FeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);

export const RouletteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2v20"/>
    <path d="M2 12h20"/>
    <path d="m19.07 4.93-14.14 14.14"/>
    <path d="m4.93 4.93 14.14 14.14"/>
  </svg>
);

export const PromoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

export const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

export const StoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="10 8 16 12 10 16 10 8"/>
  </svg>
);

export const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── VV Logo Mark ─────────────────────────────────────────────────
export const VVLogo: React.FC<{ size?: number; animated?: boolean }> = ({ size = 36, animated = false }) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-xl flex items-center justify-center relative vv-gradient-bg flex-shrink-0 ${animated ? 'vv-glow' : ''}`}
  >
    <span
      style={{ fontFamily: "'Syne', sans-serif", fontSize: size * 0.38, fontWeight: 800, letterSpacing: '-0.04em' }}
      className="text-white z-10 relative"
    >
      VV
    </span>
  </div>
);

// ─── Vibe Badge ───────────────────────────────────────────────────
export const VibeBadge: React.FC<{ vibe: string; color?: string }> = ({ vibe, color = '#e879f9' }) => (
  <div
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
    style={{ background: `${color}18`, border: `1px solid ${color}33`, color }}
  >
    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
    {vibe}
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────────
export const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 52 }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 55 ? '#e879f9' : '#f97316';
  const radius = (size - 6) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[11px] font-bold leading-none" style={{ color }}>{pct}%</span>
        <span className="text-[7px] text-white/40 mt-0.5 font-medium">sync</span>
      </div>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────
export const Avatar: React.FC<{ name: string; src?: string; size?: number; glowColor?: string; online?: boolean }> = ({
  name, src, size = 44, glowColor = '#e879f9', online = false
}) => (
  <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
    {src ? (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover border-2 w-full h-full"
        style={{ borderColor: glowColor, boxShadow: `0 0 12px ${glowColor}40` }}
      />
    ) : (
      <div
        className="rounded-full w-full h-full flex items-center justify-center text-white font-bold"
        style={{
          background: `linear-gradient(135deg, ${glowColor}88, ${glowColor}44)`,
          border: `2px solid ${glowColor}`,
          boxShadow: `0 0 12px ${glowColor}40`,
          fontSize: size * 0.32,
          fontFamily: "'Syne', sans-serif"
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    )}
    {online && (
      <div
        className="absolute border-2 rounded-full"
        style={{
          width: size * 0.28, height: size * 0.28,
          bottom: 0, right: 0,
          background: '#22c55e',
          borderColor: '#0d0a1e'
        }}
      />
    )}
  </div>
);

// ─── Stat Pill ────────────────────────────────────────────────────
export const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/8">
    <div className="text-[#e879f9]">{icon}</div>
    <div className="text-sm font-bold text-white">{value}</div>
    <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">{label}</div>
  </div>
);

// ─── Pulse Dot ────────────────────────────────────────────────────
export const PulseDot: React.FC<{ color?: string; size?: number }> = ({ color = '#22c55e', size = 8 }) => (
  <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
    <div className="relative w-full h-full rounded-full" style={{ background: color }} />
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-xl animate-pulse ${className}`}
    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)', backgroundSize: '200% 100%', animation: 'vv-shimmer 1.5s infinite' }}
  />
);

// ─── Section Header ───────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({
  title, subtitle, action, icon
}) => (
  <div className="flex items-center justify-between mb-1">
    <div>
      <div className="flex items-center gap-2">
        {icon && <div className="text-[#e879f9]">{icon}</div>}
        <h2 className="text-[18px] font-['Syne',sans-serif] font-[800] text-white tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-[11px] text-white/40 mt-0.5 font-medium">{subtitle}</p>}
    </div>
    {action}
  </div>
);
