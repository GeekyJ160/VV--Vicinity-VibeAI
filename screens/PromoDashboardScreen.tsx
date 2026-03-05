
import React, { useState } from 'react';
import { Tag, Zap, ChevronRight, Clock, MapPin, ExternalLink, TrendingUp, Gift } from 'lucide-react';
import { SectionHeader } from '../components/Icons';

interface PromoDashboardScreenProps {
  isDarkMode: boolean;
}

const PROMOS = [
  {
    id: '1', biz: "The Rooftop Bar", deal: "Happy Hour 50% OFF",
    desc: "Half-price cocktails & free appetizers. Show app at the bar.", emoji: "🍹",
    gradient: ['#f43f5e', '#e11d48'], tag: "2h left", distance: "340m", hot: true
  },
  {
    id: '2', biz: "Grind Coffee Co.", deal: "Free Pastry with Latte",
    desc: "Show your vibe and grab a complimentary pastry with any latte.", emoji: "☕",
    gradient: ['#f97316', '#ea580c'], tag: "Today only", distance: "780m", hot: false
  },
  {
    id: '3', biz: "Beat Studio", deal: "30% Off Jam Sessions",
    desc: "Book a studio room for you and your squad. Weekend special.", emoji: "🎸",
    gradient: ['#8b5cf6', '#7c3aed'], tag: "Weekend", distance: "1.1km", hot: true
  },
  {
    id: '4', biz: "Pixel Gallery", deal: "Free Entry Tonight",
    desc: "Opening night of the street art exhibition. Free drinks included.", emoji: "🎨",
    gradient: ['#06b6d4', '#0891b2'], tag: "Tonight", distance: "2.2km", hot: false
  },
];

const PromoDashboardScreen: React.FC<PromoDashboardScreenProps> = ({ isDarkMode }) => {
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: '🌐 All', count: PROMOS.length },
    { id: 'hot', label: '🔥 Hot', count: PROMOS.filter(p => p.hot).length },
    { id: 'food', label: '🍴 Food', count: 2 },
    { id: 'art', label: '🎨 Art', count: 1 },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-3 pb-24 space-y-5">

          {/* Header */}
          <SectionHeader
            title="Local Deals"
            subtitle="Exclusive perks, right now"
            icon={<Tag size={16} />}
            action={
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-[700]"
                style={{ background: 'rgba(232,121,249,0.12)', border: '1px solid rgba(232,121,249,0.25)', color: '#e879f9' }}
              >
                <TrendingUp size={10} />
                {PROMOS.length} Active
              </div>
            }
          />

          {/* ─── Hero Promo ──────────────────────────────────── */}
          <div
            className="rounded-[24px] overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #f43f5e22, #e11d4822)', border: '1px solid rgba(244,63,94,0.3)' }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: 'linear-gradient(135deg, #f43f5e, transparent 60%)' }}
            />
            <div className="p-5 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[700] mb-3"
                    style={{ background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)', color: '#f43f5e' }}
                  >
                    <Zap size={10} fill="currentColor" /> FEATURED
                  </div>
                  <h3 className="font-['Syne',sans-serif] font-[800] text-[22px] text-white tracking-tight leading-tight">
                    Happy Hour<br />50% OFF 🍹
                  </h3>
                  <p className="text-white/50 text-[12px] mt-1.5 font-medium">The Rooftop Bar · 340m away</p>
                </div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.2)' }}
                >
                  🍹
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => !redeemed.includes('featured') && setRedeemed(r => [...r, 'featured'])}
                  className="flex-1 py-3 rounded-2xl font-[700] text-[13px] transition-all active:scale-98 flex items-center justify-center gap-2"
                  style={{
                    background: redeemed.includes('featured') ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #f43f5e, #e11d48)',
                    border: redeemed.includes('featured') ? '1px solid rgba(34,197,94,0.4)' : 'none',
                    color: redeemed.includes('featured') ? '#22c55e' : 'white',
                    boxShadow: redeemed.includes('featured') ? 'none' : '0 4px 14px rgba(244,63,94,0.35)',
                  }}
                >
                  {redeemed.includes('featured') ? '✓ Redeemed' : <><Gift size={14} /> Redeem Now</>}
                </button>
                <div
                  className="flex items-center gap-1.5 px-3 py-3 rounded-2xl text-[11px] font-[700] shrink-0"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#f43f5e' }}
                >
                  <Clock size={11} />
                  2h left
                </div>
              </div>
            </div>
          </div>

          {/* ─── Category Filters ─────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-[700] whitespace-nowrap transition-all active:scale-95"
                style={{
                  background: activeCategory === cat.id ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.05)',
                  border: activeCategory === cat.id ? '1px solid rgba(232,121,249,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: activeCategory === cat.id ? '#e879f9' : 'rgba(255,255,255,0.45)',
                }}
              >
                {cat.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-[800]"
                  style={{
                    background: activeCategory === cat.id ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.1)',
                    color: activeCategory === cat.id ? '#e879f9' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* ─── Promo List ───────────────────────────────── */}
          <div className="space-y-3">
            {PROMOS.map(p => (
              <div
                key={p.id}
                className="rounded-[20px] overflow-hidden vv-card-hover"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Header band */}
                <div
                  className="px-4 py-3.5 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${p.gradient[0]}18, ${p.gradient[1]}08)`,
                    borderBottom: `1px solid ${p.gradient[0]}20`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] shrink-0"
                    style={{ background: `${p.gradient[0]}15`, border: `1px solid ${p.gradient[0]}30` }}
                  >
                    {p.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="font-['Syne',sans-serif] font-[800] text-white text-[14px] truncate"
                      >{p.deal}</span>
                      {p.hot && (
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-[800] uppercase tracking-wider"
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                        >
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/40 font-medium">{p.biz}</span>
                      <span className="text-white/20">·</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={9} style={{ color: p.gradient[0] }} />
                        <span className="text-[10px] font-[600]" style={{ color: p.gradient[0] }}>{p.distance}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-[700]"
                    style={{ background: `${p.gradient[0]}15`, color: p.gradient[0] }}
                  >
                    <Clock size={9} />{p.tag}
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 pb-4 pt-3">
                  <p className="text-[12px] text-white/50 font-medium leading-relaxed mb-3">{p.desc}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => !redeemed.includes(p.id) && setRedeemed(r => [...r, p.id])}
                      className="flex-1 py-3 rounded-xl font-[700] text-[12px] transition-all active:scale-98 flex items-center justify-center gap-1.5"
                      style={{
                        background: redeemed.includes(p.id) ? 'rgba(34,197,94,0.15)' : `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                        border: redeemed.includes(p.id) ? '1px solid rgba(34,197,94,0.3)' : 'none',
                        color: redeemed.includes(p.id) ? '#22c55e' : 'white',
                        boxShadow: redeemed.includes(p.id) ? 'none' : `0 4px 12px ${p.gradient[0]}30`,
                      }}
                    >
                      {redeemed.includes(p.id) ? '✓ Redeemed!' : <><Gift size={12} />Redeem</>}
                    </button>
                    <button
                      className="px-4 py-3 rounded-xl font-[700] text-[12px] flex items-center gap-1.5 transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Merchant CTA ──────────────────────────────── */}
          <div
            className="rounded-[20px] p-5 text-center relative overflow-hidden"
            style={{ background: 'rgba(232,121,249,0.06)', border: '1px solid rgba(232,121,249,0.15)' }}
          >
            <div className="absolute inset-0 opacity-5"
              style={{ background: 'linear-gradient(135deg, #e879f9, transparent)' }} />
            <div className="relative">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="font-['Syne',sans-serif] font-[700] text-white text-[15px] mb-1">
                Own a business?
              </h3>
              <p className="text-white/40 text-[12px] mb-4 leading-relaxed">
                Reach hundreds of nearby users with a targeted vibe campaign
              </p>
              <button
                className="px-8 py-3 rounded-2xl font-[700] text-[13px] text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)', boxShadow: '0 4px 14px rgba(232,121,249,0.3)' }}
              >
                Launch Campaign 🚀
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PromoDashboardScreen;
