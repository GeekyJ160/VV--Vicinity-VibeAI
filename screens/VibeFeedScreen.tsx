
import React, { useState, useEffect } from 'react';
import { Story, VibeUser } from '../types';
import { supabase } from '../supabaseClient';
import { MapPin, MessageCircle, Heart, Share2, Sparkles, Clock } from 'lucide-react';

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

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      // Fetch stories
      const { data: storyData } = await supabase.rpc('nearby_stories', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      // Fetch nearby users
      const { data: vibeData } = await supabase.rpc('nearby_users', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      const items: FeedItem[] = [];
      
      if (vibeData) {
        vibeData.forEach((v: VibeUser) => items.push({ type: 'vibe', data: v, id: `vibe-${v.id}` }));
      }
      
      if (storyData) {
        storyData.forEach((s: Story) => items.push({ type: 'story', data: s, id: `story-${s.id}` }));
      }

      // Shuffle or sort items (here we just interleave them roughly)
      items.sort(() => Math.random() - 0.5);

      setFeedItems(items);
      setLoading(false);
    });
  };

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
          <img src={v.avatar_url || `https://picsum.photos/seed/${v.id}/80/80`} className="w-12 h-12 rounded-full border-2 border-pink-500" alt="" />
          <div>
            <h3 className={`font-black text-base italic leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{v.name}</h3>
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
        "{v.vibe}"
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
            <Heart size={18} />
            <span className="text-[10px] font-black">24</span>
          </button>
          <button 
            onClick={() => onViewProfile && onViewProfile(v.id)}
            className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
          >
            <MessageCircle size={18} />
            <span className="text-[10px] font-black">8</span>
          </button>
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
        
        {feedItems.map((item) => 
          item.type === 'vibe' ? renderVibeCard(item.data) : renderStoryCard(item.data)
        )}
        
        {feedItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm italic">No vibes or stories nearby yet. Be the first to broadcast!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default VibeFeedScreen;
