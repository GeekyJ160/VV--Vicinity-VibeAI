
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { VibeUser } from '../types';
import { supabase } from '../supabaseClient';
import { Heart, X, Star, MapPin, Sparkles, Filter, User, Zap, Lock, ChevronUp } from 'lucide-react';
import { ScoreRing, Avatar, VibeBadge } from '../components/Icons';

interface SwipeScreenProps {
  userVibe: string;
  onMatch: (user: VibeUser) => void;
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

const MOCK_USERS: VibeUser[] = [
  { id: 'm1', name: 'Alex Chen', vibe: 'Coffee & Code', avatar_url: 'https://picsum.photos/seed/alex/600/800', distance_meters: 1200, score: 0.92, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  { id: 'm2', name: 'Sam Rivera', vibe: 'Live Music 🎸', avatar_url: 'https://picsum.photos/seed/sam/600/800', distance_meters: 800, score: 0.85, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  { id: 'm3', name: 'Jordan', vibe: 'Nightlife & Parties', avatar_url: 'https://picsum.photos/seed/jordan/600/800', distance_meters: 3000, score: 0.78, profile_privacy: 'private', chat_privacy: 'private', story_privacy: 'private', lat: 0, lng: 0 } as any,
  { id: 'm4', name: 'Casey Park', vibe: 'Yoga & Wellness', avatar_url: 'https://picsum.photos/seed/casey/600/800', distance_meters: 500, score: 0.71, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  { id: 'm5', name: 'Morgan Lee', vibe: 'Street Photography', avatar_url: 'https://picsum.photos/seed/morgan/600/800', distance_meters: 2100, score: 0.88, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
];

const SwipeScreen: React.FC<SwipeScreenProps> = ({ userVibe, onMatch, isDarkMode, onViewProfile }) => {
  const [index, setIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchUser, setMatchUser] = useState<VibeUser | null>(null);
  const [scoredUsers, setScoredUsers] = useState<VibeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [superLiked, setSuperLiked] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    const fetchAndScoreUsers = async () => {
      setIsLoading(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = pos.coords;

        if (!supabase) throw new Error('No Supabase');
        const { data: nearbyUsers, error } = await supabase.rpc('nearby_users', {
          lat: latitude, lng: longitude, radius_meters: 10000
        });

        if (error) throw error;
        if (!nearbyUsers || nearbyUsers.length === 0) {
          setScoredUsers(MOCK_USERS);
          return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const compatibilityPrompt = `
          Analyze semantic compatibility between "${userVibe}" and these users:
          ${nearbyUsers.map((u: any) => `ID: ${u.id}, Vibe: "${u.vibe}"`).join('\n')}
          Rate each 0.0-1.0 for vibe alignment.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: compatibilityPrompt,
          config: {
            systemInstruction: "You are a social energy matching AI. Analyze human vibes and find compatible people.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  semanticScore: { type: Type.NUMBER }
                },
                required: ["id", "semanticScore"]
              }
            }
          }
        });

        const aiResults = JSON.parse(response.text || '[]');
        const scoresMap = new Map(aiResults.map((r: any) => [r.id, r.semanticScore]));
        const processed = nearbyUsers.map((user: any) => {
          const semanticScore = Number(scoresMap.get(user.id)) || 0.5;
          const distValue = user.distance_meters / 1609.34;
          const proximityBonus = Math.max(0, 0.3 * (1 - distValue / 5));
          let totalScore = Math.min(0.99, Math.max(0.1, (semanticScore * 0.7) + proximityBonus));
          return { ...user, score: totalScore };
        }).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

        setScoredUsers(processed);
      } catch (error) {
        setScoredUsers(MOCK_USERS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndScoreUsers();
  }, [userVibe]);

  const filteredUsers = scoredUsers.filter(u =>
    u.vibe.toLowerCase().includes(filterText.toLowerCase()) ||
    u.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const currentUser = filteredUsers[index];
  const nextUser = filteredUsers[index + 1];

  const handleAction = (action: 'like' | 'pass' | 'superlike') => {
    if (!currentUser) return;
    const dir = action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up';
    setDirection(dir);

    if (action === 'superlike') {
      setSuperLiked(prev => [...prev, currentUser.id]);
    }

    setTimeout(() => {
      if ((action === 'like' || action === 'superlike') && (currentUser.score || 0) > 0.65) {
        setMatchUser(currentUser);
        setShowMatch(true);
        setTimeout(() => {
          setShowMatch(false);
          setMatchUser(null);
          onMatch(currentUser);
          setIndex(prev => prev + 1);
          setDirection(null);
          setDragX(0);
        }, 2200);
      } else {
        setIndex(prev => prev + 1);
        setDirection(null);
        setDragX(0);
      }
    }, 500);
  };

  // Drag handlers
  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startXRef.current;
    setDragX(dx);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (dragX > 80) handleAction('like');
    else if (dragX < -80) handleAction('pass');
    else setDragX(0);
  };

  const dragRotate = dragX * 0.08;
  const likeOpacity = Math.min(1, dragX / 80);
  const passOpacity = Math.min(1, -dragX / 80);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-[#e879f9]/20 border-t-[#e879f9] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
        <h2 className="text-lg font-['Syne',sans-serif] font-[800] text-[#e879f9] tracking-tight animate-pulse">
          Scanning Frequencies
        </h2>
        <p className="text-white/30 text-xs mt-2 font-medium">
          AI matching "{userVibe}" to nearby vibes...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center relative overflow-hidden pb-20">
      {/* ─── Match Overlay ─────────────────────────────────────── */}
      {showMatch && matchUser && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0d0a1e 0%, #1a0a2e 50%, #0d0a1e 100%)',
            animation: 'vv-fade-in 0.3s ease'
          }}
        >
          {/* Confetti-like particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6 + Math.random() * 8,
                height: 6 + Math.random() * 8,
                background: ['#e879f9', '#a855f7', '#22c55e', '#f97316'][Math.floor(Math.random() * 4)],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatUp ${1 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: 0.8
              }}
            />
          ))}

          {/* Glow circles */}
          <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />

          {/* Avatars */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 border-2 border-pink-500 flex items-center justify-center text-white font-['Syne',sans-serif] font-[700] text-xl">
              ME
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full vv-gradient-bg flex items-center justify-center">
                <Heart size={16} fill="white" className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full animate-ping bg-pink-500/30" />
            </div>
            <img
              src={matchUser.avatar_url || `https://picsum.photos/seed/${matchUser.id}/80/80`}
              className="w-20 h-20 rounded-full object-cover border-2 border-green-400"
              style={{ boxShadow: '0 0 20px rgba(34,197,94,0.5)' }}
              alt={matchUser.name}
            />
          </div>

          <h2 className="text-[36px] font-['Syne',sans-serif] font-[800] tracking-tight text-white">
            Vibe Synced! 💚
          </h2>
          <p className="text-white/60 text-sm mt-3 font-medium text-center px-8">
            You and <span className="text-[#e879f9] font-bold">{matchUser.name}</span> are on the same frequency
          </p>

          <div className="mt-6 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[#e879f9] text-xs font-semibold text-center">{matchUser.vibe}</p>
          </div>
        </div>
      )}

      {/* ─── Filter Bar ────────────────────────────────────────── */}
      <div className="w-full px-5 pt-3 pb-2">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Filter size={14} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search vibes or names..."
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setIndex(0); }}
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30 font-['DM_Sans',sans-serif]"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="text-white/40 hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!currentUser ? (
        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
          <div className="w-20 h-20 bg-[#e879f9]/10 rounded-3xl flex items-center justify-center mb-6">
            <Sparkles className="text-[#e879f9]" size={32} />
          </div>
          <h2 className="text-[20px] font-['Syne',sans-serif] font-[800] mb-2 text-white tracking-tight">All Vibes Explored!</h2>
          <p className="text-white/40 text-sm max-w-[220px] mb-8 leading-relaxed">
            {filterText ? `No vibes matching "${filterText}"` : 'Check back soon for new vibes nearby.'}
          </p>
          <button
            onClick={() => { setIndex(0); setFilterText(''); }}
            className="vv-gradient-bg px-8 py-3.5 rounded-2xl font-[700] text-sm text-white active:scale-95 transition-transform"
          >
            {filterText ? 'Clear Filter' : 'Refresh Feed'}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-5 relative w-full">

          {/* Stack preview (next card) */}
          {nextUser && (
            <div
              className="absolute rounded-[28px] overflow-hidden"
              style={{
                width: 'min(340px, calc(100vw - 40px))',
                aspectRatio: '3/4.5',
                bottom: '4.5rem',
                background: '#141414',
                transform: 'scale(0.94) translateY(16px)',
                opacity: 0.5,
                zIndex: 0,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <img
                src={nextUser.avatar_url || `https://picsum.photos/seed/${nextUser.id}/600/800`}
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
          )}

          {/* Main Card */}
          <div
            ref={cardRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative rounded-[28px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{
              width: 'min(340px, calc(100vw - 40px))',
              aspectRatio: '3/4.5',
              zIndex: 1,
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              transform: direction === 'left'
                ? 'translateX(-150%) rotate(-20deg)'
                : direction === 'right'
                  ? 'translateX(150%) rotate(20deg)'
                  : direction === 'up'
                    ? 'translateY(-150%) rotate(5deg)'
                    : isDragging
                      ? `translateX(${dragX}px) rotate(${dragRotate}deg)`
                      : 'translateX(0) rotate(0)',
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
          >
            {/* Background photo */}
            <img
              src={currentUser.profile_privacy === 'private'
                ? `https://picsum.photos/seed/private${currentUser.id}/600/800?blur=10`
                : (currentUser.avatar_url || `https://picsum.photos/seed/${currentUser.id}/600/800`)}
              className="w-full h-full object-cover pointer-events-none"
              alt={currentUser.name}
              draggable={false}
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
              }}
            />

            {/* Swipe indicators */}
            <div
              className="absolute top-6 left-6 px-4 py-2 rounded-2xl border-2 border-green-400 text-green-400"
              style={{
                opacity: Math.max(0, likeOpacity),
                transform: `rotate(-12deg)`,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                textShadow: '0 0 20px rgba(34,197,94,0.5)',
                boxShadow: '0 0 20px rgba(34,197,94,0.3)',
              }}
            >
              VIBE ✓
            </div>
            <div
              className="absolute top-6 right-6 px-4 py-2 rounded-2xl border-2 border-red-400 text-red-400"
              style={{
                opacity: Math.max(0, passOpacity),
                transform: `rotate(12deg)`,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                boxShadow: '0 0 20px rgba(239,68,68,0.3)',
              }}
            >
              PASS ✕
            </div>

            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
              {/* AI Match badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-[700]"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(232,121,249,0.3)',
                  color: '#e879f9'
                }}
              >
                <Sparkles size={10} />
                AI Match
                {superLiked.includes(currentUser.id) && <Star size={10} fill="currentColor" />}
              </div>

              {/* Score ring */}
              <ScoreRing score={currentUser.score || 0.5} size={52} />
            </div>

            {/* Privacy lock */}
            {currentUser.profile_privacy === 'private' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white/60 text-[10px] font-semibold z-10">
                <Lock size={10} />
                Private Profile
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h3
                    className="text-white leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}
                  >
                    {currentUser.profile_privacy === 'private' ? 'Private User' : currentUser.name}
                  </h3>
                  <div className="mt-1.5">
                    <VibeBadge
                      vibe={currentUser.profile_privacy === 'private' ? 'Vibe hidden' : currentUser.vibe}
                      color="#e879f9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
                >
                  <MapPin size={11} className="text-[#e879f9]" />
                  {Math.round(currentUser.distance_meters || 0)}m away
                </div>

                {onViewProfile && currentUser.profile_privacy !== 'private' && (
                  <button
                    onClick={() => onViewProfile(currentUser.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/70 hover:text-white active:scale-95 transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <User size={11} />
                    Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Action Buttons ───────────────────────────────── */}
          <div className="flex items-center gap-4 mt-6 z-10">
            <button
              onClick={() => handleAction('pass')}
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
            >
              <X size={22} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => handleAction('superlike')}
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}
            >
              <Star size={18} fill={superLiked.includes(currentUser.id) ? '#3b82f6' : 'none'} />
            </button>

            <button
              onClick={() => currentUser.chat_privacy !== 'private' ? handleAction('like') : null}
              disabled={currentUser.chat_privacy === 'private'}
              className="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: currentUser.chat_privacy === 'private'
                  ? 'rgba(100,100,100,0.3)'
                  : 'linear-gradient(135deg, #e879f9, #a855f7)',
                boxShadow: currentUser.chat_privacy === 'private'
                  ? 'none'
                  : '0 0 24px rgba(232,121,249,0.45), 0 4px 16px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.15)'
              }}
            >
              <Heart size={26} fill="white" className="text-white" />
              <span className="text-[9px] font-[700] text-white uppercase tracking-wider">
                {currentUser.chat_privacy === 'private' ? 'Locked' : 'Vibe'}
              </span>
            </button>

            <button
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}
            >
              <Zap size={18} />
            </button>

            <button
              onClick={() => onViewProfile && onViewProfile(currentUser.id)}
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            >
              <ChevronUp size={22} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {filteredUsers.slice(0, Math.min(filteredUsers.length, 8)).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 16 : 5,
                  height: 5,
                  background: i === index ? '#e879f9' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeScreen;
