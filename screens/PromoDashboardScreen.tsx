
import React, { useState, useRef } from 'react';
import { Promo } from '../types';

interface PromoDashboardScreenProps {
  isDarkMode: boolean;
}

const PromoDashboardScreen: React.FC<PromoDashboardScreenProps> = ({ isDarkMode }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [promos, setPromos] = useState<Promo[]>([
    { id: '1', title: 'Half-off Tacos', description: 'Available for first 20 vibes!', discount: '50% OFF', lat: 35, lng: 40, active: true },
    { id: '2', title: 'Happy Hour Extend', description: 'Vibe verified only.', discount: '$4 Pints', lat: 55, lng: 65, active: true },
    { id: '3', title: 'Free App-etizer', description: 'With any cocktail purchase.', discount: 'FREE APP', lat: 20, lng: 75, active: true },
  ]);

  const [form, setForm] = useState({ title: '', desc: '', discount: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMapPromo, setSelectedMapPromo] = useState<Promo | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // State for swipe gesture tracking
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartPos = useRef<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    if (editingId) {
      setPromos(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
      setEditingId(null);
    } else {
      const newPromo: Promo = {
        id: Date.now().toString(),
        title: form.title,
        description: form.desc,
        discount: form.discount,
        lat: Math.floor(Math.random() * 60) + 20,
        lng: Math.floor(Math.random() * 60) + 20,
        active: true,
      };
      setPromos([newPromo, ...promos]);
    }
    setForm({ title: '', desc: '', discount: '' });
  };

  const startEdit = (promo: Promo) => {
    setForm({ title: promo.title, desc: promo.description, discount: promo.discount });
    setEditingId(promo.id);
    setSwipingId(null);
    setSwipeOffset(0);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const removePromo = (id: string) => {
    setPromos(prev => prev.filter(p => p.id !== id));
    setSwipingId(null);
    setSwipeOffset(0);
    if (selectedMapPromo?.id === id) setSelectedMapPromo(null);
  };

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartPos.current = e.touches[0].clientX;
    setSwipingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    const currentPos = e.touches[0].clientX;
    const diff = currentPos - touchStartPos.current;
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -160));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -80) {
      setSwipeOffset(-160);
    } else {
      setSwipingId(null);
      setSwipeOffset(0);
    }
  };

  return (
    <div className={`p-6 space-y-8 pb-10 overflow-x-hidden min-h-full flex flex-col transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      <header className="text-center shrink-0">
        <h2 className="text-3xl font-bold italic">🚀 Business Portal</h2>
        <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Manage your venue's local presence.</p>
      </header>

      {/* Form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className={`p-6 rounded-3xl border transition-all duration-500 space-y-4 shadow-xl shrink-0 ${isDarkMode ? 'bg-[#1E1B4B]' : 'bg-white'} ${editingId ? 'border-pink-500 shadow-pink-500/10' : isDarkMode ? 'border-white/5' : 'border-slate-200'}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-pink-500 uppercase tracking-widest text-sm">
            {editingId ? '✨ Editing Vibe Promo' : 'Create New Vibe Promo'}
          </h3>
          {editingId && (
            <button 
              type="button"
              onClick={() => setEditingId(null)}
              className={`text-[10px] font-bold underline ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              CANCEL
            </button>
          )}
        </div>
        
        <input 
          type="text" 
          placeholder="Promo Title (e.g. Free Coffee)" 
          className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-sm transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="Discount/Offer (e.g. 20% OFF)" 
          className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-sm transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          value={form.discount}
          onChange={e => setForm({...form, discount: e.target.value})}
        />
        <textarea 
          placeholder="Short description..." 
          className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-pink-500 h-20 resize-none text-sm transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          value={form.desc}
          onChange={e => setForm({...form, desc: e.target.value})}
        />
        <button 
          type="submit"
          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg text-white ${editingId ? 'bg-pink-600 hover:bg-pink-500' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
        >
          {editingId ? 'UPDATE PROMO' : 'LAUNCH PROMO'}
        </button>
      </form>

      {/* Active Promos Section */}
      <div className="flex-1 flex flex-col space-y-4 min-h-[400px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className={`font-bold ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Live Vicinity Deals ({promos.length})</h3>
          
          <div className={`p-1 rounded-xl flex border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              LIST
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              MAP
            </button>
          </div>
        </div>
        
        {promos.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center py-10 rounded-3xl border border-dashed transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <p className="text-zinc-500 italic">No active promos. Launch one above!</p>
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className="space-y-4">
              {promos.map(p => (
                <div key={p.id} className="relative group overflow-hidden rounded-2xl h-[92px]">
                  {/* Action Buttons Panel */}
                  <div className={`absolute inset-0 flex items-center justify-end rounded-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                    <div className="flex h-full w-[160px]">
                      <button 
                        onClick={() => startEdit(p)}
                        className="flex-1 bg-violet-600 flex flex-col items-center justify-center text-white transition-colors hover:bg-violet-500"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        <span className="text-[9px] font-black mt-1">EDIT</span>
                      </button>
                      <button 
                        onClick={() => removePromo(p.id)}
                        className="flex-1 bg-red-600 flex flex-col items-center justify-center text-white transition-colors hover:bg-red-500"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        <span className="text-[9px] font-black mt-1">END</span>
                      </button>
                    </div>
                  </div>

                  {/* Foreground Content */}
                  <div 
                    onTouchStart={(e) => handleTouchStart(e, p.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ 
                      transform: `translateX(${swipingId === p.id ? swipeOffset : 0}px)`,
                      transition: swipingId === p.id ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                    className={`absolute inset-0 p-4 flex justify-between items-center z-10 backdrop-blur-sm border-l-4 transition-colors cursor-grab active:cursor-grabbing ${editingId === p.id ? 'bg-pink-600/20 border-pink-500' : isDarkMode ? 'bg-[#1E1B4B] border-pink-500/40' : 'bg-white border-pink-400 shadow-sm'}`}
                  >
                    <div className="overflow-hidden pr-4">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-bold text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.title}</h4>
                      </div>
                      <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} text-xs line-clamp-1`}>{p.description}</p>
                      <span className="text-emerald-500 font-bold text-sm mt-0.5 inline-block">{p.discount}</span>
                    </div>
                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-green-500 font-black uppercase tracking-tighter">Live</span>
                      </div>
                      <div className={`text-[8px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Swipe ←</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Promo Map View */
            <div className={`flex-1 relative rounded-3xl overflow-hidden border transition-colors duration-300 min-h-[350px] ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-100 shadow-inner'}`}>
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#94a3b8'} 1px, transparent 1px)`,
                  backgroundSize: '30px 30px'
                }}
              />

              {promos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedMapPromo(p)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10"
                  style={{ left: `${p.lng}%`, top: `${p.lat}%` }}
                >
                  <div className={`p-2 rounded-full border-2 shadow-lg transition-colors duration-300 ${selectedMapPromo?.id === p.id ? 'border-pink-500 scale-125' : 'border-emerald-500'} ${isDarkMode ? 'bg-[#1E1B4B]' : 'bg-white'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedMapPromo?.id === p.id ? '#EC4899' : '#10B981'} strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </div>
                </button>
              ))}

              {selectedMapPromo && (
                <div className={`absolute bottom-4 left-4 right-4 p-4 backdrop-blur-md rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-2 z-20 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E1B4B]/95 border-emerald-500/30' : 'bg-white/95 border-emerald-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Active Deal</span>
                      <h4 className={`font-bold text-lg mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedMapPromo.title}</h4>
                      <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} text-xs mb-2`}>{selectedMapPromo.description}</p>
                      <div className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-emerald-600'}`}>{selectedMapPromo.discount}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedMapPromo(null)}
                      className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => removePromo(selectedMapPromo.id)}
                      className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                    >
                      END PROMO
                    </button>
                    <button 
                      onClick={() => {
                        startEdit(selectedMapPromo);
                        setSelectedMapPromo(null);
                      }}
                      className="flex-1 py-2 bg-pink-600/20 hover:bg-pink-600/30 text-pink-500 rounded-xl text-xs font-bold transition-all border border-pink-500/20"
                    >
                      EDIT DEAL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PromoDashboardScreen;
