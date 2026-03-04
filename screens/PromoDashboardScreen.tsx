
import React, { useState } from 'react';
import { Promo } from '../types';

interface PromoDashboardScreenProps {
  isDarkMode: boolean;
}

const PROMOS = [
  { id: '1', biz: "The Rooftop Bar", deal: "Happy Hour 50% OFF", desc: "Half-price cocktails & free appetizers until 8PM", emoji: "🍹", color: "#f43f5e", tag: "Ends in 2h" },
  { id: '2', biz: "Grind Coffee Co.", deal: "Free Pastry with Latte", desc: "Show your Coffee Chat vibe for a free treat", emoji: "☕", color: "#f97316", tag: "Today only" },
  { id: '3', biz: "Beat Studio", deal: "30% off jam sessions", desc: "Book a room and bring a Music Jam buddy", emoji: "🎸", color: "#8b5cf6", tag: "Weekend" },
];

const PromoDashboardScreen: React.FC<PromoDashboardScreenProps> = ({ isDarkMode }) => {
  const [redeemed, setRedeemed] = useState<string[]>([]);

  return (
    <div className="h-full flex flex-col p-5 animate-in fade-in duration-500 overflow-y-auto pb-24">
      <div className="mb-5">
        <div className="font-['Syne',sans-serif] text-[22px] font-[800] tracking-[-0.5px] mb-1">
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Local </span>
          <span className="text-[#e879f9]">Promos</span>
        </div>
        <div className="text-[12px] font-['DM_Sans',sans-serif] text-white/40 mb-5">
          Exclusive deals for your vibe, right now
        </div>
      </div>

      <div className="flex flex-col gap-[14px]">
        {PROMOS.map(p => (
          <div 
            key={p.id} 
            className="overflow-hidden rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10"
          >
            <div 
              className="p-[14px_16px] flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${p.color}22, transparent)`,
                borderBottom: `1px solid ${p.color}22`
              }}
            >
              <div 
                className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[24px]"
                style={{
                  background: `${p.color}22`,
                  border: `1px solid ${p.color}44`
                }}
              >
                {p.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-[2px]">
                  <span className="font-['Syne',sans-serif] font-[800] text-white text-[15px]">{p.deal}</span>
                  <span 
                    className="px-2 py-[2px] rounded-[20px] text-[9px] font-['DM_Sans',sans-serif] font-[600]"
                    style={{ background: `${p.color}33`, color: p.color }}
                  >
                    {p.tag}
                  </span>
                </div>
                <div className="text-[11px] text-white/50 font-['DM_Sans',sans-serif]">{p.biz}</div>
              </div>
            </div>
            
            <div className="p-[12px_16px]">
              <div className="text-[13px] text-white/60 font-['DM_Sans',sans-serif] mb-3">
                {p.desc}
              </div>
              <div className="flex gap-[10px]">
                <button 
                  onClick={() => !redeemed.includes(p.id) && setRedeemed(r => [...r, p.id])}
                  className="flex-1 p-[10px] rounded-[12px] font-['DM_Sans',sans-serif] font-[700] text-[13px] cursor-pointer transition-all"
                  style={{
                    background: redeemed.includes(p.id) 
                      ? "rgba(34,197,94,0.2)" 
                      : `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
                    border: redeemed.includes(p.id) ? "1px solid #22c55e44" : "none",
                    color: redeemed.includes(p.id) ? "#22c55e" : "#fff"
                  }}
                >
                  {redeemed.includes(p.id) ? "✓ Redeemed!" : "Redeem Now"}
                </button>
                <button 
                  className="p-[10px_16px] bg-white/5 border border-white/10 rounded-[12px] text-white/70 font-['DM_Sans',sans-serif] font-[700] text-[13px] cursor-pointer"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Merchant CTA */}
      <div className="p-4 mt-4 text-center rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10">
        <div className="font-['Syne',sans-serif] font-[700] text-white text-[14px] mb-[6px]">
          Own a business? 🏪
        </div>
        <div className="text-[12px] text-white/40 font-['DM_Sans',sans-serif] mb-3">
          Post your promo to reach nearby users
        </div>
        <button 
          className="px-6 py-[10px] rounded-[50px] bg-gradient-to-br from-[#e879f9] to-[#a855f7] border-none text-white font-['Syne',sans-serif] font-[700] text-[13px] cursor-pointer shadow-[0_0_16px_rgba(232,121,249,0.3)]"
        >
          Launch a Campaign 🚀
        </button>
      </div>
    </div>
  );
};

export default PromoDashboardScreen;
