
import React, { useState, useEffect, useMemo } from 'react';
import { Story } from '../types';
import { supabase } from '../supabaseClient';
import { Camera, Plus, ChevronLeft, ChevronRight, Filter, Clock, MapPin, SlidersHorizontal } from 'lucide-react';

interface StoriesScreenProps {
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ isDarkMode, onViewProfile }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storyPrivacy, setStoryPrivacy] = useState<'everyone' | 'private'>('everyone');
  
  // Filtering & Sorting State
  const [filterText, setFilterText] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recency' | 'proximity'>('recency');
  const [showFilters, setShowFilters] = useState(false);

  // Floating emojis state
  const [floatingEmojis, setFloatingEmojis] = useState<{id: number, emoji: string, x: number}[]>([]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = pos.coords;
      
      if (!supabase) return;
      const { data, error } = await supabase.rpc('nearby_stories', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      if (error) throw error;

      // Filter out stories from users who have story_privacy set to 'private'
      const filteredStories = data?.filter((s: any) => s.story_privacy !== 'private') || [];
      setStories(filteredStories);
    } catch (err) {
      console.error('Error fetching stories:', err);
      // Fallback to mock data for prototyping
      setStories([
        { id: 's1', user_id: 'm1', name: 'Alex', vibe: 'Coffee & Code', image_url: 'https://picsum.photos/seed/alex/400/600', caption: 'Morning brew ☕', created_at: new Date().toISOString(), distance_meters: 1200, avatar_url: 'https://picsum.photos/seed/alex/100/100', story_privacy: 'everyone', lat: 0, lng: 0 },
        { id: 's2', user_id: 'm2', name: 'Sam', vibe: 'Live Music', image_url: 'https://picsum.photos/seed/sam/400/600', caption: 'Soundcheck 🎸', created_at: new Date(Date.now() - 3600000).toISOString(), distance_meters: 800, avatar_url: 'https://picsum.photos/seed/sam/100/100', story_privacy: 'everyone', lat: 0, lng: 0 },
        { id: 's3', user_id: 'm3', name: 'Jordan', vibe: 'Chill', image_url: 'https://picsum.photos/seed/jordan/400/600', caption: 'Park vibes 🌳', created_at: new Date(Date.now() - 7200000).toISOString(), distance_meters: 3500, avatar_url: 'https://picsum.photos/seed/jordan/100/100', story_privacy: 'everyone', lat: 0, lng: 0 },
        { id: 's4', user_id: 'm4', name: 'Casey', vibe: 'Party', image_url: 'https://picsum.photos/seed/casey/400/600', caption: 'Let\'s gooo 🎉', created_at: new Date(Date.now() - 1800000).toISOString(), distance_meters: 8500, avatar_url: 'https://picsum.photos/seed/casey/100/100', story_privacy: 'everyone', lat: 0, lng: 0 }
      ]);
    }
  };

  const filteredAndSortedStories = useMemo(() => {
    let result = [...stories];

    // Filter by text (user name, caption, or vibe)
    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(s => 
        (s.caption?.toLowerCase().includes(lowerFilter)) || 
        (s.name?.toLowerCase().includes(lowerFilter)) ||
        (s.vibe?.toLowerCase().includes(lowerFilter))
      );
    }

    // Filter by distance
    if (maxDistance !== null) {
      result = result.filter(s => (s.distance_meters || 0) <= maxDistance);
    }

    // Sort
    if (sortBy === 'recency') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      result.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }

    return result;
  }, [stories, filterText, maxDistance, sortBy]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `stories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Using existing bucket for simplicity, usually separate
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('stories').insert({
      user_id: user.id,
      image_url: publicUrl,
      caption: 'New vibe! ✨',
      lat: 0, // Should ideally get current lat/lng
      lng: 0,
      story_privacy: storyPrivacy
    });

    if (dbError) {
      console.error('DB error:', dbError);
    } else {
      fetchStories();
    }

    setUploading(false);
  };

  const storyNext = () => {
    if (currentStoryIndex !== null && currentStoryIndex < filteredAndSortedStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setCurrentStoryIndex(null);
    }
  };

  const storyPrev = () => {
    if (currentStoryIndex !== null && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleReaction = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.random() * 80 + 10, // random percentage between 10% and 90%
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    
    // Remove emoji after animation
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 overflow-hidden">
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nearby Stories</h2>
        <div className="flex items-center space-x-3">
          <select 
            value={storyPrivacy}
            onChange={(e) => setStoryPrivacy(e.target.value as 'everyone' | 'private')}
            className={`text-xs font-bold uppercase tracking-wider outline-none cursor-pointer bg-transparent border-none ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}
          >
            <option value="everyone" className={isDarkMode ? 'bg-zinc-800' : 'bg-white'}>Public</option>
            <option value="private" className={isDarkMode ? 'bg-zinc-800' : 'bg-white'}>Private</option>
          </select>
          <label className="cursor-pointer bg-pink-600 p-3 rounded-full shadow-lg shadow-pink-500/30 active:scale-95 transition-all">
            <Plus className="text-white" size={24} />
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col space-y-3 mb-6">
        <div className="flex space-x-2">
          <div className={`flex-1 flex items-center space-x-2 px-4 py-2 rounded-2xl border backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <Filter size={16} className={isDarkMode ? 'text-zinc-400' : 'text-slate-400'} />
            <input 
              type="text" 
              placeholder="Search user, vibe, or caption..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-2xl border flex items-center justify-center transition-colors ${
              showFilters 
                ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20' 
                : isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {showFilters && (
          <div className={`p-4 rounded-2xl border space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200'}`}>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Distance</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Any', value: null },
                  { label: '< 1km', value: 1000 },
                  { label: '< 5km', value: 5000 },
                  { label: '< 10km', value: 10000 },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setMaxDistance(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      maxDistance === opt.value
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                        : isDarkMode ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Sort By</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSortBy('recency')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === 'recency' 
                      ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20' 
                      : isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <Clock size={12} />
                  <span>Newest</span>
                </button>
                <button 
                  onClick={() => setSortBy('proximity')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === 'proximity' 
                      ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20' 
                      : isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <MapPin size={12} />
                  <span>Closest</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mb-6 bg-pink-500/10 border border-pink-500/20 p-4 rounded-2xl flex items-center space-x-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
          <span className="text-xs font-black uppercase tracking-widest text-pink-500">Uploading your vibe...</span>
        </div>
      )}

      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide shrink-0">
        {filteredAndSortedStories.map((s, idx) => (
          <div key={s.id} className="flex flex-col items-center shrink-0 space-y-2" onClick={() => setCurrentStoryIndex(idx)}>
            <div className={`w-20 h-20 rounded-full p-1 border-2 border-pink-500 cursor-pointer active:scale-95 transition-all`}>
              <img src={s.image_url} className="w-full h-full rounded-full object-cover" alt={s.name} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{s.name}</span>
          </div>
        ))}
        {filteredAndSortedStories.length === 0 && (
          <div className="text-zinc-500 text-xs italic py-4">
            {filterText || maxDistance !== null ? 'No stories match your filters.' : 'No stories nearby yet. Be the first!'}
          </div>
        )}
      </div>

      {currentStoryIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-md">
            <img src={filteredAndSortedStories[currentStoryIndex].image_url} className="w-full h-full object-cover" />
            
            <div className="absolute top-10 left-6 right-6 flex items-center space-x-1.5 z-50">
              {filteredAndSortedStories.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    key={idx === currentStoryIndex ? `anim-${currentStoryIndex}` : `static-${idx}`}
                    className={`h-full bg-white ${
                      idx === currentStoryIndex 
                        ? '' 
                        : idx < currentStoryIndex 
                          ? 'w-full' 
                          : 'w-0'
                    }`}
                    style={idx === currentStoryIndex ? { animation: 'progress 5s linear forwards' } : {}}
                    onAnimationEnd={idx === currentStoryIndex ? storyNext : undefined}
                  ></div>
                </div>
              ))}
            </div>

            <div 
              className="absolute top-16 left-6 flex items-center space-x-3 z-50 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewProfile) {
                  onViewProfile(filteredAndSortedStories[currentStoryIndex].user_id);
                  setCurrentStoryIndex(null); // Optional: close story when opening profile
                }
              }}
            >
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 overflow-hidden">
                <img src={filteredAndSortedStories[currentStoryIndex].avatar_url || filteredAndSortedStories[currentStoryIndex].image_url} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white font-black text-sm hover:underline">{filteredAndSortedStories[currentStoryIndex].name}</div>
                <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  {Math.round(filteredAndSortedStories[currentStoryIndex].distance_meters || 0)}m away
                </div>
              </div>
            </div>

            <button onClick={() => setCurrentStoryIndex(null)} className="absolute top-16 right-6 text-white/50 hover:text-white">
              ✕
            </button>

            <div className="absolute inset-y-0 left-0 w-1/4 z-40" onClick={storyPrev}></div>
            <div className="absolute inset-y-0 right-0 w-1/4 z-40" onClick={storyNext}></div>

            {/* Floating Emojis */}
            {floatingEmojis.map(fe => (
              <div 
                key={fe.id}
                className="absolute bottom-40 text-4xl pointer-events-none z-[60] animate-[floatUp_2s_ease-out_forwards]"
                style={{ left: `${fe.x}%` }}
              >
                {fe.emoji}
              </div>
            ))}

            <div className="absolute bottom-10 left-6 right-6 flex flex-col space-y-3 z-50">
              <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-white text-sm font-medium">{filteredAndSortedStories[currentStoryIndex].caption}</p>
              </div>
              
              {/* Reaction Bar */}
              <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                {['❤️', '😂', '😮', '😢', '🔥', '👏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={(e) => handleReaction(emoji, e)}
                    className="text-2xl hover:scale-125 transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) {
                    onViewProfile(filteredAndSortedStories[currentStoryIndex].user_id);
                    setCurrentStoryIndex(null);
                  }
                }}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors z-50"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-6 flex-1 rounded-3xl p-10 border text-center flex flex-col items-center justify-center transition-colors duration-300 shadow-sm ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-slate-100'}`}>
        <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
          <Camera className="text-pink-500" size={32} />
        </div>
        <h3 className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Broadcast your vibe</h3>
        <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-400'} text-sm mt-2 max-w-[240px] leading-relaxed`}>
          Share what's happening in your vicinity. Stories disappear after 24 hours.
        </p>

        <div className={`mt-6 flex space-x-1 p-1 rounded-xl ${isDarkMode ? 'bg-black/40' : 'bg-slate-100'}`}>
          <button
            onClick={() => setStoryPrivacy('everyone')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              storyPrivacy === 'everyone'
                ? isDarkMode ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setStoryPrivacy('private')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              storyPrivacy === 'private'
                ? isDarkMode ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Private
          </button>
        </div>

        <button 
          onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
          className="mt-6 bg-pink-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-pink-500 transition-all text-white shadow-xl shadow-pink-500/20 active:scale-95"
        >
          POST STORY
        </button>
      </div>
    </div>
  );
};

export default StoriesScreen;
