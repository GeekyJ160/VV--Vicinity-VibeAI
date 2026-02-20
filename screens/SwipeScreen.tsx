
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { VibeUser } from '../types';

interface SwipeScreenProps {
  userVibe: string;
  onMatch: (user: VibeUser) => void;
  isDarkMode: boolean;
}

const SwipeScreen: React.FC<SwipeScreenProps> = ({ userVibe, onMatch, isDarkMode }) => {
  const [index, setIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [scoredUsers, setScoredUsers] = useState<VibeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mockUsers: VibeUser[] = [
    { id: '1', name: 'Alex 🌙', vibe: 'Nightlife Coffee ☕ late-night', lat: 40, lng: 30, distance: '0.2mi', verified: true, avatar: 'https://picsum.photos/id/64/400/500' },
    { id: '2', name: 'Jamie 🎸', vibe: 'Live Music Rock concerts indie', lat: 60, lng: 70, distance: '0.5mi', verified: true, avatar: 'https://picsum.photos/id/65/400/500' },
    { id: '3', name: 'Sam 🌳', vibe: 'Park Hangout Chill nature walking', lat: 25, lng: 45, distance: '0.1mi', verified: true, avatar: 'https://picsum.photos/id/66/400/500' },
    { id: '4', name: 'Taylor 🍻', vibe: 'Happy Hour Beer social pub-crawl', lat: 75, lng: 20, distance: '0.9mi', verified: false, avatar: 'https://picsum.photos/id/67/400/500' },
    { id: '5', name: 'Zoe 🎨', vibe: 'Art Gallery Creative museums', lat: 30, lng: 60, distance: '1.2mi', verified: true, avatar: 'https://picsum.photos/id/102/400/500' },
  ];

  useEffect(() => {
    const fetchAIScores = async () => {
      setIsLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const compatibilityPrompt = `
          Analyze the semantic compatibility between the primary user's vibe and a list of other people's vibes.
          Primary User Vibe: "${userVibe}"
          
          Candidates:
          ${mockUsers.map(u => `ID: ${u.id}, Vibe: "${u.vibe}"`).join('\n')}
          
          Rate each candidate from 0.0 to 1.0 based on how well their interests align with the primary user.
          High scores (0.8+) for strong semantic matches (e.g., 'Coffee' and 'Late night music' are both social/after-hours).
          Medium scores (0.4-0.7) for related but different interests.
          Low scores (0.0-0.3) for conflicting or completely unrelated interests.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: compatibilityPrompt,
          config: {
            systemInstruction: "You are a social energy matching AI. You analyze human vibes and interests to find the most compatible people nearby. Be creative but accurate with semantic relationships.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  semanticScore: { type: Type.NUMBER, description: "A score from 0.0 to 1.0" }
                },
                required: ["id", "semanticScore"]
              }
            }
          }
        });

        const aiResults = JSON.parse(response.text || '[]');
        const scoresMap = new Map(aiResults.map((r: any) => [r.id, r.semanticScore]));

        const processed = mockUsers.map(user => {
          // Explicitly cast or default to number for semanticScore
          const semanticScore = Number(scoresMap.get(user.id)) || 0.5;
          
          // Proximity Bonus Logic
          const distValue = parseFloat(user.distance.replace('mi', '')) || 1.0;
          const proximityBonus = Math.max(0, 0.3 * (1 - distValue / 2)); // 30% weight to proximity

          // Final score is 70% AI semantic match + 30% proximity
          // Ensure totalScore calculation is robust
          let totalScore = (semanticScore * 0.7) + proximityBonus;
          totalScore = Math.min(0.99, Math.max(0.1, totalScore));

          return { ...user, score: totalScore };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));

        setScoredUsers(processed);
      } catch (error) {
        console.error("Gemini Vibe Match Error, falling back to basic matching:", error);
        // Fallback Logic: ensure sort handles optional score property safely
        const fallback = mockUsers.map(user => ({
          ...user,
          score: 0.5 + (Math.random() * 0.4)
        })).sort((a, b) => (b.score || 0) - (a.score || 0));
        setScoredUsers(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIScores();
  }, [userVibe]);

  const currentUser = scoredUsers[index];

  const handleAction = (isVibe: boolean) => {
    if (isVibe && (currentUser.score || 0) > 0.65) {
      setShowMatch(true);
      setTimeout(() => {
        setShowMatch(false);
        onMatch(currentUser);
      }, 1800);
    } else {
      setIndex((prev) => (prev + 1) % scoredUsers.length);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-emerald-400';
    if (score > 0.5) return 'text-amber-400';
    return 'text-zinc-400';
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

  if (!currentUser) {
    return (
      <div className={`h-full flex items-center justify-center p-10 text-center transition-colors duration-300 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
        <div className="space-y-4">
          <span className="text-4xl opacity-20">📡</span>
          <p className="italic font-medium">All vibes explored. Check back soon or widen your search!</p>
          <button 
            onClick={() => setIndex(0)}
            className="text-pink-500 font-black text-xs uppercase tracking-widest border-b border-pink-500 pb-1"
          >
            Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center relative animate-in fade-in duration-500 max-w-md mx-auto">
      {showMatch && (
        <div className="absolute inset-0 z-[60] bg-emerald-600 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300 rounded-[2.5rem] shadow-[0_0_100px_rgba(16,185,129,0.5)]">
          <div className="text-7xl mb-6 animate-bounce">💖</div>
          <h2 className="text-4xl font-black italic tracking-tighter">VIBE SYNC!</h2>
          <p className="mt-4 font-bold text-emerald-100 uppercase tracking-widest text-sm px-8 text-center">
            AI detected a perfect frequency match with {currentUser.name}
          </p>
          <div className="mt-8 flex -space-x-4">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-zinc-800 flex items-center justify-center text-2xl shadow-lg">🧑‍🚀</div>
            <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-lg" alt="" />
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className={`relative w-full aspect-[3/4.2] rounded-[2.5rem] overflow-hidden shadow-2xl border transition-all duration-300 group ${isDarkMode ? 'border-white/10 bg-zinc-900' : 'border-slate-200 bg-white shadow-slate-300/50'}`}>
        <img src={currentUser.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms] ease-out" alt={currentUser.name} />
        
        {/* AI Analysis Badge */}
        <div className="absolute top-6 left-6 z-20">
          <div className={`backdrop-blur-xl border px-3 py-1.5 rounded-xl flex items-center space-x-2 transition-colors duration-300 shadow-xl ${isDarkMode ? 'bg-black/60 border-white/20' : 'bg-white/80 border-slate-200'}`}>
            <span className="text-[10px] font-black text-pink-500 animate-pulse">AI MATCH</span>
          </div>
        </div>

        {/* Match Percentage Badge */}
        <div className="absolute top-6 right-6 z-20">
          <div className={`backdrop-blur-xl border px-4 py-2 rounded-2xl flex flex-col items-center transition-colors duration-300 shadow-xl ${isDarkMode ? 'bg-black/60 border-white/20' : 'bg-white/80 border-slate-200'}`}>
            <span className={`text-xl font-black leading-none ${getScoreColor(currentUser.score || 0)}`}>
              {Math.round((currentUser.score || 0) * 100)}%
            </span>
            <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Sync</span>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
          <div className="flex items-center space-x-2">
            <h3 className="text-3xl font-black text-white italic tracking-tight">{currentUser.name}</h3>
            {currentUser.verified && (
              <div className="bg-pink-500 text-white rounded-full p-1 shadow-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </div>
          
          <p className="text-zinc-300 text-sm mt-2 font-medium line-clamp-2 leading-tight italic">
            "{currentUser.vibe}"
          </p>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-pink-400">📍</span>
              <span className="text-xs font-black text-white uppercase tracking-widest">{currentUser.distance} away</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full ${i < Math.floor((currentUser.score || 0) * 5) ? 'bg-pink-500 shadow-[0_0_5px_#EC4899]' : 'bg-white/20'}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-8 mt-10 items-center">
        <button 
          onClick={() => handleAction(false)}
          className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl transition-all shadow-lg active:scale-90 group ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700 hover:border-white/20' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'}`}
        >
          <span className="group-hover:rotate-12 transition-transform">✕</span>
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse"></div>
          <button 
            onClick={() => handleAction(true)}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 shadow-2xl shadow-pink-500/40 flex flex-col items-center justify-center relative hover:scale-110 active:scale-95 transition-all text-white border-2 border-white/20"
          >
            <span className="text-4xl mb-1">💖</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">Vibe Sync</span>
          </button>
        </div>

        <button 
          className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl transition-all shadow-lg active:scale-90 ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'}`}
        >
          <span>⚡</span>
        </button>
      </div>
      
      <p className="mt-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
        <span className="w-1 h-1 bg-pink-500 rounded-full animate-ping"></span>
        AI optimizing local connections
      </p>
    </div>
  );
};

export default SwipeScreen;
