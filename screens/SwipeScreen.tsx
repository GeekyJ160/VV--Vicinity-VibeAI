
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
        if (!supabase) return;
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
        // Fallback to mock data for prototyping
        const MOCK_USERS: VibeUser[] = [
          { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', avatar_url: 'https://picsum.photos/seed/alex/600/800', distance_meters: 1200, score: 0.92, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
          { id: 'm2', name: 'Sam', vibe: 'Live Music', avatar_url: 'https://picsum.photos/seed/sam/600/800', distance_meters: 800, score: 0.85, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
          { id: 'm3', name: 'Jordan', vibe: 'Nightlife', avatar_url: 'https://picsum.photos/seed/jordan/600/800', distance_meters: 3000, score: 0.78, profile_privacy: 'private', chat_privacy: 'private', story_privacy: 'private', lat: 0, lng: 0 },
        ];
        setScoredUsers(MOCK_USERS);
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
          <div className="w-24 h-24 rounded-full border-4 border-[#e879f9]/20 border-t-[#e879f9] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
        </div>
        <h2 className="mt-8 text-xl font-black italic text-[#e879f9] tracking-widest animate-pulse">
          SCANNING LOCAL FREQUENCIES
        </h2>
        <p className={`mt-2 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          AI analyzing compatibility for "{userVibe}"
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-5 items-center justify-center relative animate-in fade-in duration-500 overflow-hidden pb-24">
      
      {/* Filter Bar */}
      <div className="absolute top-5 left-5 right-5 z-50">
        <div className="flex items-center space-x-2 px-4 py-3 rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10 shadow-lg transition-colors">
          <Filter size={16} className="text-white/40" />
          <input 
            type="text" 
            placeholder="Filter vibes (e.g., coffee, music)..." 
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setIndex(0); // Reset index when filter changes
            }}
            className="bg-transparent border-none outline-none text-[14px] font-['DM_Sans',sans-serif] w-full text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {!currentUser ? (
        <div className={`flex flex-col items-center justify-center p-10 text-center transition-colors duration-300 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
          <div className="w-20 h-20 bg-[#e879f9]/10 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="text-[#e879f9]" size={32} />
          </div>
          <h2 className="text-[20px] font-['Syne',sans-serif] font-[800] mb-2 text-white">All vibes explored!</h2>
          <p className="text-[14px] font-['DM_Sans',sans-serif] max-w-[240px] mb-8 text-white/60">
            {filterText ? `No more vibes matching "${filterText}". Try clearing your filter.` : 'Check back soon or broaden your horizons to find more vibes nearby.'}
          </p>
          <button 
            onClick={() => {
              setIndex(0);
              setFilterText('');
            }}
            className="bg-[#e879f9] px-8 py-4 rounded-[20px] font-['DM_Sans',sans-serif] font-[700] text-[14px] text-white shadow-[0_0_20px_rgba(232,121,249,0.3)] active:scale-95"
          >
            {filterText ? 'CLEAR FILTER' : 'REFRESH FEED'}
          </button>
        </div>
      ) : (
        <>
          {showMatch && (
            <div className="fixed inset-0 z-[100] bg-[#22c55e] flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
              <div className="text-7xl mb-6 animate-bounce">💖</div>
              <h2 className="text-[40px] font-['Syne',sans-serif] font-[800] tracking-[-1px]">VIBE SYNC!</h2>
              <p className="mt-4 font-['DM_Sans',sans-serif] font-[700] text-white/80 text-[14px] px-8 text-center">
                AI detected a perfect frequency match with {currentUser.name}
              </p>
            </div>
          )}

          <div className={`relative w-full max-w-[340px] aspect-[3/4.5] rounded-[32px] overflow-hidden shadow-2xl border transition-all duration-500 transform mt-12 ${
            direction === 'left' ? '-translate-x-[150%] rotate-[-20deg] opacity-0' : 
            direction === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : 
            'translate-x-0 rotate-0 opacity-100'
          } border-white/10 bg-[#141414]`}>
            <img 
              src={currentUser.profile_privacy === 'private' ? `https://picsum.photos/seed/private/600/800?blur=10` : (currentUser.avatar_url || `https://picsum.photos/seed/${currentUser.id}/600/800`)} 
              className="w-full h-full object-cover" 
              alt={currentUser.name} 
            />
            
            <div className="absolute top-5 left-5 z-20">
              <div className="bg-white/10 backdrop-blur-[16px] border border-white/20 px-[12px] py-[6px] rounded-[16px] flex items-center shadow-xl">
                <span className="text-[10px] font-['DM_Sans',sans-serif] font-[700] text-[#e879f9] animate-pulse">AI Match</span>
              </div>
            </div>

            <div className="absolute top-5 right-5 z-20">
              <div className="bg-white/10 backdrop-blur-[16px] border border-white/20 px-[14px] py-[8px] rounded-[20px] flex flex-col items-center shadow-xl">
                <span className={`text-[20px] font-['Syne',sans-serif] font-[800] leading-none ${currentUser.score && currentUser.score > 0.8 ? 'text-[#22c55e]' : 'text-white'}`}>
                  {Math.round((currentUser.score || 0) * 100)}%
                </span>
                <span className="text-[8px] font-['DM_Sans',sans-serif] font-[700] text-white/60 mt-1">Sync</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a1e] via-[#0d0a1e]/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-[28px] font-['Syne',sans-serif] font-[800] text-white tracking-[-0.5px]">
                {currentUser.profile_privacy === 'private' ? "Private User" : currentUser.name}
              </h3>
              <p className="text-[#e879f9] font-['DM_Sans',sans-serif] font-[600] text-[14px] mt-1 mb-4">
                {currentUser.profile_privacy === 'private' ? "Vibe is hidden" : currentUser.vibe}
              </p>
              
              <div className="flex items-center space-x-2">
                <div className="bg-white/10 backdrop-blur-[16px] px-[12px] py-[8px] rounded-[16px] border border-white/10 flex items-center space-x-1.5">
                  <MapPin className="text-white/60" size={14} />
                  <span className="text-[11px] font-['DM_Sans',sans-serif] font-[600] text-white">
                    {Math.round(currentUser.distance_meters || 0)}m away
                  </span>
                </div>
                <button 
                  onClick={() => onViewProfile && onViewProfile(currentUser.id)}
                  className="bg-white/10 backdrop-blur-[16px] px-[12px] py-[8px] rounded-[16px] border border-white/10 flex items-center space-x-1.5 hover:bg-white/20 transition-colors"
                >
                  <User className="text-white/60" size={14} />
                  <span className="text-[11px] font-['DM_Sans',sans-serif] font-[600] text-white">
                    Profile
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-6 mt-8 items-center">
            <button 
              onClick={() => handleAction(false)}
              className="w-[60px] h-[60px] rounded-full bg-white/5 backdrop-blur-[16px] border border-white/10 flex items-center justify-center transition-all shadow-lg active:scale-90 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <button 
              onClick={() => currentUser.chat_privacy !== 'private' ? handleAction(true) : null}
              disabled={currentUser.chat_privacy === 'private'}
              className={`w-[80px] h-[80px] rounded-full shadow-[0_0_30px_rgba(232,121,249,0.3)] flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/20 ${
                currentUser.chat_privacy === 'private' 
                ? 'bg-zinc-600 grayscale cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-br from-[#e879f9] to-[#a855f7]'
              }`}
            >
              <Heart size={32} fill="currentColor" />
              <span className="text-[10px] font-['DM_Sans',sans-serif] font-[700] mt-1">
                {currentUser.chat_privacy === 'private' ? 'Disabled' : 'Vibe'}
              </span>
            </button>

            <button 
              className="w-[60px] h-[60px] rounded-full bg-white/5 backdrop-blur-[16px] border border-white/10 flex items-center justify-center transition-all shadow-lg active:scale-90 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Star size={24} fill="currentColor" className="text-[#e879f9]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SwipeScreen;
