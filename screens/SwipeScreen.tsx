
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { VibeUser } from '../types';
import { supabase } from '../supabaseClient';
import { Heart, X, Star, MapPin, Sparkles, Filter, User } from 'lucide-react';

interface SwipeScreenProps {
  userVibe: string;
  onMatch: (user: VibeUser) => void;
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

const SwipeScreen: React.FC<SwipeScreenProps> = ({ userVibe, onMatch, isDarkMode, onViewProfile }) => {
  const [index, setIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [scoredUsers, setScoredUsers] = useState<VibeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const fetchAndScoreUsers = async () => {
      setIsLoading(true);
      try {
        // 1. Get current location
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = pos.coords;

        // 2. Fetch nearby users from Supabase
        const { data: nearbyUsers, error } = await supabase.rpc('nearby_users', {
          lat: latitude,
          lng: longitude,
          radius_meters: 10000
        });

        if (error) throw error;
        if (!nearbyUsers || nearbyUsers.length === 0) {
          setScoredUsers([]);
          return;
        }

        // 3. AI Scoring
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const compatibilityPrompt = `
          Analyze the semantic compatibility between the primary user's vibe and a list of other people's vibes.
          Primary User Vibe: "${userVibe}"
          
          Candidates:
          ${nearbyUsers.map((u: any) => `ID: ${u.id}, Vibe: "${u.vibe}"`).join('\n')}
          
          Rate each candidate from 0.0 to 1.0 based on how well their interests align with the primary user.
          High scores (0.8+) for strong semantic matches.
          Medium scores (0.4-0.7) for related but different interests.
          Low scores (0.0-0.3) for unrelated interests.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: compatibilityPrompt,
          config: {
            systemInstruction: "You are a social energy matching AI. You analyze human vibes and interests to find the most compatible people nearby.",
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
          const distValue = user.distance_meters / 1609.34; // meters to miles
          const proximityBonus = Math.max(0, 0.3 * (1 - distValue / 5));
          let totalScore = (semanticScore * 0.7) + proximityBonus;
          totalScore = Math.min(0.99, Math.max(0.1, totalScore));
          return { ...user, score: totalScore };
        }).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

        setScoredUsers(processed);
      } catch (error) {
        console.error("Vibe Match Error:", error);
        setScoredUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndScoreUsers();
  }, [userVibe]);

  const filteredUsers = scoredUsers.filter(u => 
    u.vibe.toLowerCase().includes(filterText.toLowerCase())
  );

  const currentUser = filteredUsers[index];

  const handleAction = (isVibe: boolean) => {
    setDirection(isVibe ? 'right' : 'left');
    
    setTimeout(() => {
      if (isVibe && (currentUser.score || 0) > 0.65) {
        setShowMatch(true);
        setTimeout(() => {
          setShowMatch(false);
          onMatch(currentUser);
          setIndex(prev => prev + 1);
          setDirection(null);
        }, 1800);
      } else {
        setIndex((prev) => prev + 1);
        setDirection(null);
      }
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
        </div>
        <h2 className="mt-8 text-xl font-black italic text-pink-500 tracking-widest animate-pulse">
          SCANNING LOCAL FREQUENCIES
        </h2>
        <p className={`mt-2 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          AI analyzing compatibility for "{userVibe}"
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center relative animate-in fade-in duration-500 max-w-md mx-auto overflow-hidden">
      
      {/* Filter Bar */}
      <div className="absolute top-6 left-6 right-6 z-50">
        <div className={`flex items-center space-x-2 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg transition-colors ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900'}`}>
          <Filter size={16} className={isDarkMode ? 'text-zinc-400' : 'text-slate-400'} />
          <input 
            type="text" 
            placeholder="Filter vibes (e.g., coffee, music)..." 
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setIndex(0); // Reset index when filter changes
            }}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
          />
        </div>
      </div>

      {!currentUser ? (
        <div className={`flex flex-col items-center justify-center p-10 text-center transition-colors duration-300 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="text-pink-500" size={32} />
          </div>
          <h2 className="text-xl font-black italic mb-2">All vibes explored!</h2>
          <p className="text-sm max-w-[240px] mb-8">
            {filterText ? `No more vibes matching "${filterText}". Try clearing your filter.` : 'Check back soon or broaden your horizons to find more vibes nearby.'}
          </p>
          <button 
            onClick={() => {
              setIndex(0);
              setFilterText('');
            }}
            className="bg-pink-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl shadow-pink-500/20 active:scale-95"
          >
            {filterText ? 'CLEAR FILTER' : 'REFRESH FEED'}
          </button>
        </div>
      ) : (
        <>
          {showMatch && (
            <div className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
              <div className="text-7xl mb-6 animate-bounce">💖</div>
              <h2 className="text-4xl font-black italic tracking-tighter">VIBE SYNC!</h2>
              <p className="mt-4 font-bold text-emerald-100 uppercase tracking-widest text-sm px-8 text-center">
                AI detected a perfect frequency match with {currentUser.name}
              </p>
            </div>
          )}

          <div className={`relative w-full aspect-[3/4.2] rounded-[3rem] overflow-hidden shadow-2xl border transition-all duration-500 transform mt-12 ${
            direction === 'left' ? '-translate-x-[150%] rotate-[-20deg] opacity-0' : 
            direction === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : 
            'translate-x-0 rotate-0 opacity-100'
          } ${isDarkMode ? 'border-white/10 bg-zinc-900' : 'border-slate-200 bg-white'}`}>
            <img src={currentUser.avatar_url || `https://picsum.photos/seed/${currentUser.id}/600/800`} className="w-full h-full object-cover" alt={currentUser.name} />
            
            <div className="absolute top-6 left-6 z-20">
              <div className={`backdrop-blur-xl border px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-xl ${isDarkMode ? 'bg-black/60 border-white/20' : 'bg-white/80 border-slate-200'}`}>
                <span className="text-[10px] font-black text-pink-500 animate-pulse uppercase tracking-widest">AI Match</span>
              </div>
            </div>

            <div className="absolute top-6 right-6 z-20">
              <div className={`backdrop-blur-xl border px-4 py-2 rounded-2xl flex flex-col items-center shadow-xl ${isDarkMode ? 'bg-black/60 border-white/20' : 'bg-white/80 border-slate-200'}`}>
                <span className={`text-xl font-black leading-none ${currentUser.score && currentUser.score > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {Math.round((currentUser.score || 0) * 100)}%
                </span>
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-60">Sync</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h3 className="text-3xl font-black text-white italic tracking-tight">{currentUser.name}</h3>
              <p className="text-pink-400 font-black text-xs uppercase tracking-[0.2em] mt-2 mb-4">{currentUser.vibe}</p>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
                  <MapPin className="text-pink-400" size={14} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {Math.round(currentUser.distance_meters || 0)}m away
                  </span>
                </div>
                <button 
                  onClick={() => onViewProfile && onViewProfile(currentUser.id)}
                  className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 hover:bg-white/20 transition-colors"
                >
                  <User className="text-white" size={14} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Profile
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-8 mt-10 items-center">
            <button 
              onClick={() => handleAction(false)}
              className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-90 ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <X size={28} />
            </button>
            
            <button 
              onClick={() => handleAction(true)}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 shadow-2xl shadow-pink-500/40 flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all text-white border-2 border-white/20"
            >
              <Heart size={32} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-1">Vibe Sync</span>
            </button>

            <button 
              className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-90 ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <Star size={24} fill="currentColor" className="text-amber-500" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SwipeScreen;
