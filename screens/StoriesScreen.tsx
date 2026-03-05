
import React, { useState, useEffect, useMemo } from 'react';
import { Story } from '../types';
import { supabase } from '../supabaseClient';
import { Camera, Plus, Filter, Clock, MapPin, SlidersHorizontal, Video, X, Play } from 'lucide-react';
import { SectionHeader, PulseDot } from '../components/Icons';

interface StoriesScreenProps {
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

const MOCK_STORIES: Story[] = [
  { id: 's1', user_id: 'm1', name: 'Alex Chen', vibe: 'Coffee & Code ☕', image_url: 'https://picsum.photos/seed/alex/400/700', caption: 'Morning brew ☕ Best spot in the city', created_at: new Date().toISOString(), distance_meters: 1200, avatar_url: 'https://picsum.photos/seed/alex/100/100', story_privacy: 'everyone', expires_at: '', lat: 0, lng: 0 },
  { id: 's2', user_id: 'm2', name: 'Sam Rivera', vibe: 'Live Music 🎸', image_url: 'https://picsum.photos/seed/concert/400/700', caption: 'Soundcheck 🎸 Front row at Neon Lounge', created_at: new Date(Date.now() - 1800000).toISOString(), distance_meters: 800, avatar_url: 'https://picsum.photos/seed/sam/100/100', story_privacy: 'everyone', expires_at: '', lat: 0, lng: 0 },
  { id: 's3', user_id: 'm3', name: 'Jordan K.', vibe: 'Chill 🌿', image_url: 'https://picsum.photos/seed/nature/400/700', caption: 'Park vibes 🌳 Perfect afternoon', created_at: new Date(Date.now() - 7200000).toISOString(), distance_meters: 3500, avatar_url: 'https://picsum.photos/seed/jordan/100/100', story_privacy: 'everyone', expires_at: '', lat: 0, lng: 0 },
  { id: 's4', user_id: 'm4', name: 'Casey Park', vibe: 'Party 🎉', image_url: 'https://picsum.photos/seed/party/400/700', caption: 'Let\'s goooo!! 🎉 Rooftop vibes', created_at: new Date(Date.now() - 1800000).toISOString(), distance_meters: 8500, avatar_url: 'https://picsum.photos/seed/casey/100/100', story_privacy: 'everyone', expires_at: '', lat: 0, lng: 0 },
  { id: 's5', user_id: 'm5', name: 'Morgan Lee', vibe: 'Photography 📷', image_url: 'https://picsum.photos/seed/street/400/700', caption: 'Golden hour 📷 Downtown never looked better', created_at: new Date(Date.now() - 3600000).toISOString(), distance_meters: 2000, avatar_url: 'https://picsum.photos/seed/morgan/100/100', story_privacy: 'everyone', expires_at: '', lat: 0, lng: 0 },
];

const StoriesScreen: React.FC<StoriesScreenProps> = ({ isDarkMode, onViewProfile }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storyPrivacy, setStoryPrivacy] = useState<'everyone' | 'private'>('everyone');
  const [filterText, setFilterText] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recency' | 'proximity'>('recency');
  const [showFilters, setShowFilters] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const { latitude, longitude } = pos.coords;
      if (!supabase) throw new Error('No Supabase');
      const { data, error } = await supabase.rpc('nearby_stories', { lat: latitude, lng: longitude, radius_meters: 10000 });
      if (error) throw error;
      const filtered = data?.filter((s: any) => s.story_privacy !== 'private') || [];
      setStories(filtered);
    } catch {
      setStories(MOCK_STORIES);
    }
  };

  const filteredAndSortedStories = useMemo(() => {
    let result = [...stories];
    if (filterText.trim()) {
      const lf = filterText.toLowerCase();
      result = result.filter(s => s.caption?.toLowerCase().includes(lf) || s.name?.toLowerCase().includes(lf) || s.vibe?.toLowerCase().includes(lf));
    }
    if (maxDistance !== null) result = result.filter(s => (s.distance_meters || 0) <= maxDistance);
    if (sortBy === 'recency') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else result.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    return result;
  }, [stories, filterText, maxDistance, sortBy]);

  const currentStory = currentStoryIndex !== null ? filteredAndSortedStories[currentStoryIndex] : null;

  const storyNext = () => {
    if (currentStoryIndex !== null && currentStoryIndex < filteredAndSortedStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setStoryProgress(0);
    } else {
      setCurrentStoryIndex(null);
    }
  };

  const storyPrev = () => {
    if (currentStoryIndex !== null && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setStoryProgress(0);
    }
  };

  const handleReaction = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fe = { id: Date.now() + Math.random(), emoji, x: Math.random() * 80 + 10 };
    setFloatingEmojis(prev => [...prev, fe]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== fe.id)), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <style>{`
        @keyframes progress { 0% { width: 0% } 100% { width: 100% } }
        @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-200px) scale(1.5); opacity: 0; } }
      `}</style>

      {/* ─── Story Viewer ─────────────────────────────────────── */}
      {currentStory && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-md mx-auto">
            {/* Background Image */}
            <img src={currentStory.image_url} className="w-full h-full object-cover" alt="" />

            {/* Gradient overlays */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.8) 100%)' }} />

            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-50">
              {filteredAndSortedStories.map((_, idx) => (
                <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/25">
                  <div
                    key={`${idx}-${currentStoryIndex}`}
                    className="h-full rounded-full bg-white"
                    style={{
                      width: idx < (currentStoryIndex || 0) ? '100%' : '0%',
                      animation: idx === currentStoryIndex ? 'progress 5s linear forwards' : 'none',
                    }}
                    onAnimationEnd={idx === currentStoryIndex ? storyNext : undefined}
                  />
                </div>
              ))}
            </div>

            {/* User info header */}
            <div className="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-50">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) { onViewProfile(currentStory.user_id); setCurrentStoryIndex(null); }
                }}
              >
                <div className="p-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)' }}>
                  <img
                    src={currentStory.avatar_url || currentStory.image_url}
                    className="w-9 h-9 rounded-full object-cover border-2"
                    style={{ borderColor: '#000' }}
                    alt=""
                  />
                </div>
                <div>
                  <div className="text-white font-['Syne',sans-serif] font-[700] text-[13px] hover:underline">{currentStory.name}</div>
                  <div className="text-white/50 text-[10px] font-medium">
                    {Math.round(currentStory.distance_meters || 0)}m away
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setCurrentStoryIndex(null); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Touch nav zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40" onClick={storyPrev} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-40" onClick={storyNext} />

            {/* Floating emoji reactions */}
            {floatingEmojis.map(fe => (
              <div key={fe.id} className="absolute bottom-40 text-4xl pointer-events-none z-[60]"
                style={{ left: `${fe.x}%`, animation: 'floatUp 2s ease-out forwards' }}>
                {fe.emoji}
              </div>
            ))}

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-50 space-y-3">
              {currentStory.caption && (
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-white text-sm font-medium leading-relaxed">{currentStory.caption}</p>
                </div>
              )}

              {/* Reactions */}
              <div
                className="flex justify-between items-center p-3 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {['❤️', '😂', '😮', '😢', '🔥', '👏'].map(emoji => (
                  <button key={emoji} onClick={(e) => handleReaction(emoji, e)} className="text-2xl hover:scale-125 transition-transform active:scale-95">
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); if (onViewProfile) { onViewProfile(currentStory.user_id); setCurrentStoryIndex(null); } }}
                className="w-full py-3 rounded-2xl text-white font-[700] text-[12px] uppercase tracking-widest transition-all active:scale-98"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-3 pb-24 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Live Stories"
              subtitle="Moments happening now"
              icon={<Play size={16} />}
            />
            <div className="flex items-center gap-2">
              <select
                value={storyPrivacy}
                onChange={(e) => setStoryPrivacy(e.target.value as any)}
                className="text-[11px] font-[700] uppercase tracking-wider outline-none cursor-pointer bg-transparent text-white/40 border-none"
              >
                <option value="everyone" style={{ background: '#0d0a1e' }}>Public</option>
                <option value="private" style={{ background: '#0d0a1e' }}>Private</option>
              </select>
              <label
                className="cursor-pointer w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)', boxShadow: '0 4px 12px rgba(232,121,249,0.35)' }}
              >
                <Plus size={20} className="text-white" />
                <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !supabase) return;
                  setUploading(true);
                  // ... upload logic ...
                  setUploading(false);
                }} disabled={uploading} />
              </label>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(232,121,249,0.08)', border: '1px solid rgba(232,121,249,0.2)' }}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#e879f9] border-t-transparent" />
              <span className="text-[12px] font-[700] text-[#e879f9] uppercase tracking-wider">Uploading your vibe...</span>
            </div>
          )}

          {/* ─── Filter Row ─────────────────────────────────── */}
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Filter size={14} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search stories..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/25 font-['DM_Sans',sans-serif]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{
                background: showFilters ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.05)',
                border: showFilters ? '1px solid rgba(232,121,249,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: showFilters ? '#e879f9' : 'rgba(255,255,255,0.4)',
              }}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {showFilters && (
            <div
              className="p-4 rounded-2xl space-y-4 vv-slide-up"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div>
                <label className="text-[10px] font-[800] uppercase tracking-widest text-white/30 mb-2 block">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {[{ label: 'Any', value: null }, { label: '<1km', value: 1000 }, { label: '<5km', value: 5000 }, { label: '<10km', value: 10000 }].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setMaxDistance(opt.value)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-[700] transition-all active:scale-95"
                      style={{
                        background: maxDistance === opt.value ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.05)',
                        border: maxDistance === opt.value ? '1px solid rgba(232,121,249,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: maxDistance === opt.value ? '#e879f9' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-[800] uppercase tracking-widest text-white/30 mb-2 block">Sort</label>
                <div className="flex gap-2">
                  {[{ id: 'recency', label: 'Newest', icon: <Clock size={11} /> }, { id: 'proximity', label: 'Closest', icon: <MapPin size={11} /> }].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id as any)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-[700] transition-all"
                      style={{
                        background: sortBy === opt.id ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.05)',
                        border: sortBy === opt.id ? '1px solid rgba(232,121,249,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: sortBy === opt.id ? '#e879f9' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Story Ring Carousel ──────────────────────── */}
          <div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {/* Add Story button */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <label
                  className="cursor-pointer w-[70px] h-[70px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '2px dashed rgba(232,121,249,0.4)',
                  }}
                >
                  <Plus size={24} className="text-[#e879f9]" />
                  <input type="file" accept="image/*" className="hidden" />
                </label>
                <span className="text-[10px] font-[700] text-white/40 uppercase tracking-tight">You</span>
              </div>

              {filteredAndSortedStories.map((s, idx) => {
                const timeAgo = Math.round((Date.now() - new Date(s.created_at).getTime()) / 60000);
                const isNew = timeAgo < 60;
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1.5 shrink-0" onClick={() => setCurrentStoryIndex(idx)}>
                    <div
                      className="w-[70px] h-[70px] rounded-full p-[2px] cursor-pointer active:scale-95 transition-all"
                      style={{
                        background: isNew
                          ? 'linear-gradient(135deg, #e879f9, #a855f7, #7c3aed)'
                          : 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <img src={s.image_url} className="w-full h-full rounded-full object-cover border-2" style={{ borderColor: '#0d0a1e' }} alt={s.name} />
                    </div>
                    <span className="text-[10px] font-[700] text-white/50 uppercase tracking-tight max-w-[60px] truncate text-center">{s.name.split(' ')[0]}</span>
                  </div>
                );
              })}

              {filteredAndSortedStories.length === 0 && (
                <div className="text-white/25 text-xs italic py-5">No stories nearby.</div>
              )}
            </div>
          </div>

          {/* ─── Story Cards Grid ────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            {filteredAndSortedStories.map((s, idx) => {
              const timeAgo = Math.round((Date.now() - new Date(s.created_at).getTime()) / 60000);
              const timeStr = timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo / 60)}h`;

              return (
                <div
                  key={s.id}
                  className="relative rounded-[20px] overflow-hidden cursor-pointer active:scale-98 transition-all"
                  style={{ aspectRatio: '3/4' }}
                  onClick={() => setCurrentStoryIndex(idx)}
                >
                  <img src={s.image_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />

                  {/* Top: distance badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-[700]"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#e879f9' }}>
                    <MapPin size={8} />
                    {Math.round(s.distance_meters || 0)}m
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <img src={s.avatar_url || `https://picsum.photos/seed/${s.user_id}/40/40`} className="w-5 h-5 rounded-full object-cover border border-[#e879f9]" alt="" />
                      <span className="text-white text-[11px] font-[700] truncate">{s.name.split(' ')[0]}</span>
                    </div>
                    <p className="text-white/70 text-[10px] font-medium leading-tight line-clamp-2">{s.caption}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={8} className="text-white/30" />
                      <span className="text-[9px] text-white/30 font-medium">{timeStr} ago</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAndSortedStories.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-4 opacity-20">📸</div>
              <p className="text-white/25 text-sm">{filterText || maxDistance ? 'No stories match filters.' : 'No stories nearby yet.'}</p>
            </div>
          )}

          {/* ─── Post Story CTA ──────────────────────────── */}
          <div
            className="rounded-[24px] p-6 flex flex-col items-center text-center relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(232,121,249,0.1)', border: '1px solid rgba(232,121,249,0.2)' }}
            >
              <Camera className="text-[#e879f9]" size={28} />
            </div>
            <h3 className="font-['Syne',sans-serif] font-[800] text-white text-[17px] tracking-tight mb-1">Broadcast Your Vibe</h3>
            <p className="text-white/35 text-[12px] font-medium leading-relaxed mb-5 max-w-[220px]">
              Share what's happening around you. Stories disappear after 24h.
            </p>

            {/* Privacy toggle */}
            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {(['everyone', 'private'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setStoryPrivacy(v)}
                  className="px-4 py-2 rounded-lg text-[11px] font-[700] uppercase tracking-wider transition-all"
                  style={{
                    background: storyPrivacy === v ? 'rgba(232,121,249,0.2)' : 'transparent',
                    border: storyPrivacy === v ? '1px solid rgba(232,121,249,0.3)' : '1px solid transparent',
                    color: storyPrivacy === v ? '#e879f9' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {v === 'everyone' ? '🌐 Public' : '🔒 Private'}
                </button>
              ))}
            </div>

            <label className="cursor-pointer vv-gradient-bg px-8 py-3.5 rounded-2xl font-[700] text-[13px] text-white uppercase tracking-wider transition-all active:scale-95" style={{ boxShadow: '0 4px 16px rgba(232,121,249,0.35)' }}>
              <span className="flex items-center gap-2"><Plus size={16} />Post Story</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;
