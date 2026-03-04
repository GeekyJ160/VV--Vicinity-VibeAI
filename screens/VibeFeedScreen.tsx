
import React, { useState, useEffect, useMemo } from 'react';
import { Story, VibeUser } from '../types';
import { supabase } from '../supabaseClient';
import { MapPin, MessageCircle, Heart, Share2, Sparkles, Clock, Filter } from 'lucide-react';

interface VibeFeedScreenProps {
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

type FeedItem = 
  | { type: 'vibe'; data: VibeUser; id: string }
  | { type: 'story'; data: Story; id: string };

const VibeFeedScreen: React.FC<VibeFeedScreenProps> = ({ isDarkMode, onViewProfile }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'recency' | 'proximity'>('recency');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = pos.coords;

      // Fetch stories
      if (!supabase) return;
      const { data: storyData, error: storyError } = await supabase.rpc('nearby_stories', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      // Fetch nearby users
      if (!supabase) return;
      const { data: vibeData, error: vibeError } = await supabase.rpc('nearby_users', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      if (storyError || vibeError) throw new Error('Failed to fetch feed data');

      const items: FeedItem[] = [];
      
      if (vibeData) {
        vibeData.forEach((v: VibeUser) => items.push({ type: 'vibe', data: v, id: `vibe-${v.id}` }));
      }
      
      if (storyData) {
        storyData
          .filter((s: any) => s.story_privacy !== 'private')
          .forEach((s: Story) => items.push({ type: 'story', data: s, id: `story-${s.id}` }));
      }

      setFeedItems(items);
    } catch (err) {
      console.error("Error fetching feed:", err);
      // Fallback to mock data for prototyping
      setFeedItems([
        { type: 'vibe', id: 'vibe-m1', data: { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', avatar_url: 'https://picsum.photos/seed/alex/100/100', distance_meters: 1200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } },
        { type: 'story', id: 'story-s1', data: { id: 's1', user_id: 'm2', name: 'Sam', vibe: 'Live Music', image_url: 'https://picsum.photos/seed/sam/400/600', caption: 'Soundcheck 🎸', created_at: new Date(Date.now() - 3600000).toISOString(), distance_meters: 800, avatar_url: 'https://picsum.photos/seed/sam/100/100', story_privacy: 'everyone', lat: 0, lng: 0 } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...feedItems];

    // Filter
    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'vibe') {
          return item.data.name.toLowerCase().includes(lowerFilter) || 
                 item.data.vibe.toLowerCase().includes(lowerFilter);
        } else {
          return item.data.name.toLowerCase().includes(lowerFilter) || 
                 item.data.caption?.toLowerCase().includes(lowerFilter) ||
                 item.data.vibe?.toLowerCase().includes(lowerFilter);
        }
      });
    }

    // Sort
    if (sortBy === 'recency') {
      result.sort((a, b) => {
        const timeA = a.type === 'story' ? new Date(a.data.created_at).getTime() : new Date(a.data.updated_at || 0).getTime();
        const timeB = b.type === 'story' ? new Date(b.data.created_at).getTime() : new Date(b.data.updated_at || 0).getTime();
        return timeB - timeA;
      });
    } else {
      result.sort((a, b) => {
        const distA = a.data.distance_meters || 0;
        const distB = b.data.distance_meters || 0;
        return distA - distB;
      });
    }

    return result;
  }, [feedItems, filterText, sortBy]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  const renderVibeCard = (v: VibeUser) => (
    <div 
      key={`vibe-${v.id}`} 
      className={`rounded-[2.5rem] p-6 border transition-all duration-300 ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div 
          className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewProfile && onViewProfile(v.id)}
        >
          <img 
            src={v.profile_privacy === 'private' ? `https://picsum.photos/seed/private/80/80?blur=10` : (v.avatar_url || `https://picsum.photos/seed/${v.id}/80/80`)} 
            className="w-12 h-12 rounded-full border-2 border-pink-500 object-cover" 
            alt="" 
          />
          <div>
            <h3 className={`font-black text-base italic leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {v.profile_privacy === 'private' ? "Private User" : v.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1.5">
              <MapPin className="text-pink-500" size={10} />
              <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">{Math.round(v.distance_meters || 0)}m away</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
          Vibe
        </div>
      </div>

      <div className={`p-4 rounded-2xl mb-6 italic text-sm ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-slate-50 text-slate-600'}`}>
        {v.profile_privacy === 'private' ? '"Vibe is hidden"' : `"${v.vibe}"`}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
            <Heart size={18} />
            <span className="text-[10px] font-black">24</span>
          </button>
          {v.chat_privacy !== 'private' && (
            <button 
              onClick={() => onViewProfile && onViewProfile(v.id)}
              className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
            >
              <MessageCircle size={18} />
              <span className="text-[10px] font-black">8</span>
            </button>
          )}
        </div>
        <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );

  const renderStoryCard = (s: Story) => {
    const timeAgo = Math.round((new Date().getTime() - new Date(s.created_at).getTime()) / 60000);
    const timeString = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;

    return (
      <div 
        key={`story-${s.id}`} 
        className={`rounded-[2.5rem] overflow-hidden border transition-all duration-300 ${
          isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div 
            className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewProfile && onViewProfile(s.user_id)}
          >
            <div className="w-12 h-12 rounded-full p-0.5 border-2 border-pink-500">
              <img src={`https://picsum.photos/seed/${s.user_id}/80/80`} className="w-full h-full rounded-full object-cover" alt="" />
            </div>
            <div>
              <h3 className={`font-black text-base italic leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</h3>
              <div className="flex items-center space-x-2 mt-1.5">
                <Clock className="text-pink-500" size={10} />
                <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">{timeString}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
            Story
          </div>
        </div>

        <div className="w-full aspect-square relative">
          <img src={s.image_url} className="w-full h-full object-cover" alt="Story" />
          {s.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium text-sm">{s.caption}</p>
            </div>
          )}
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex space-x-4">
            <button className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
              <Heart size={18} />
            </button>
            <button 
              onClick={() => onViewProfile && onViewProfile(s.user_id)}
              className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
            >
              <MessageCircle size={18} />
            </button>
          </div>
          <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
            <Share2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto scrollbar-hide animate-in fade-in duration-500">
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-lg font-black italic tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vicinity Feed</h2>
          <Sparkles className="text-pink-500" size={16} />
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-col space-y-3">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <Filter size={16} className={isDarkMode ? 'text-zinc-400' : 'text-slate-400'} />
            <input 
              type="text" 
              placeholder="Filter feed by vibe..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
            />
          </div>
          
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
              <span>Recent</span>
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
              <span>Nearby</span>
            </button>
          </div>
        </div>
        
        {filteredAndSortedItems.map((item) => 
          item.type === 'vibe' ? renderVibeCard(item.data) : renderStoryCard(item.data)
        )}
        
        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm italic">
              {filterText ? `No results matching "${filterText}"` : 'No vibes or stories nearby yet. Be the first to broadcast!'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default VibeFeedScreen;
