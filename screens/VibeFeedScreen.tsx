
import React, { useState, useEffect, useMemo } from 'react';
import { Story, VibeUser } from '../types';
import { supabase } from '../supabaseClient';
import { MapPin, MessageCircle, Heart, Share2, Sparkles, Clock, Filter, TrendingUp, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, VibeBadge, PulseDot, ScoreRing, SectionHeader } from '../components/Icons';

interface VibeFeedScreenProps {
  isDarkMode: boolean;
  onViewProfile?: (userId: string) => void;
}

type FeedItem =
  | { type: 'vibe'; data: VibeUser; id: string }
  | { type: 'story'; data: Story; id: string };

const MOCK_FEED: FeedItem[] = [
  {
    type: 'vibe', id: 'vibe-m1',
    data: { id: 'm1', name: 'Alex Chen', vibe: 'Coffee & Code ☕', avatar_url: 'https://picsum.photos/seed/alex/100/100', distance_meters: 1200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', updated_at: new Date().toISOString(), lat: 0, lng: 0 } as any,
  },
  {
    type: 'story', id: 'story-s1',
    data: { id: 's1', user_id: 'm2', name: 'Sam Rivera', vibe: 'Live Music 🎸', image_url: 'https://picsum.photos/seed/concert/400/500', caption: 'Soundcheck 🎸 Front row at Neon Lounge tonight', created_at: new Date(Date.now() - 1800000).toISOString(), distance_meters: 800, story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  },
  {
    type: 'vibe', id: 'vibe-m3',
    data: { id: 'm3', name: 'Morgan Lee', vibe: 'Street Photography 📷', avatar_url: 'https://picsum.photos/seed/morgan/100/100', distance_meters: 2100, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', updated_at: new Date(Date.now() - 3600000).toISOString(), lat: 0, lng: 0 } as any,
  },
  {
    type: 'story', id: 'story-s2',
    data: { id: 's2', user_id: 'm4', name: 'Casey Park', vibe: 'Yoga & Wellness 🧘', image_url: 'https://picsum.photos/seed/yoga/400/500', caption: 'Morning sun salutation in the park 🌅', created_at: new Date(Date.now() - 5400000).toISOString(), distance_meters: 500, story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  },
  {
    type: 'vibe', id: 'vibe-m5',
    data: { id: 'm5', name: 'Jordan K.', vibe: 'Nightlife & Parties 🌙', avatar_url: 'https://picsum.photos/seed/jordan/100/100', distance_meters: 3200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', updated_at: new Date(Date.now() - 7200000).toISOString(), lat: 0, lng: 0 } as any,
  },
];

const VibeFeedScreen: React.FC<VibeFeedScreenProps> = ({ isDarkMode, onViewProfile }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'recency' | 'proximity'>('recency');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'vibes' | 'stories'>('all');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const { latitude, longitude } = pos.coords;

      if (!supabase) throw new Error('No Supabase');
      const [storyRes, vibeRes] = await Promise.all([
        supabase.rpc('nearby_stories', { lat: latitude, lng: longitude, radius_meters: 10000 }),
        supabase.rpc('nearby_users', { lat: latitude, lng: longitude, radius_meters: 10000 }),
      ]);

      if (storyRes.error || vibeRes.error) throw new Error('Fetch failed');

      const items: FeedItem[] = [];
      if (vibeRes.data) vibeRes.data.forEach((v: VibeUser) => items.push({ type: 'vibe', data: v, id: `vibe-${v.id}` }));
      if (storyRes.data) storyRes.data.filter((s: any) => s.story_privacy !== 'private').forEach((s: Story) => items.push({ type: 'story', data: s, id: `story-${s.id}` }));
      setFeedItems(items);
    } catch {
      setFeedItems(MOCK_FEED);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...feedItems];

    if (activeFilter === 'vibes') result = result.filter(i => i.type === 'vibe');
    if (activeFilter === 'stories') result = result.filter(i => i.type === 'story');

    if (filterText.trim()) {
      const lf = filterText.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'vibe') return item.data.name.toLowerCase().includes(lf) || item.data.vibe.toLowerCase().includes(lf);
        return item.data.name.toLowerCase().includes(lf) || item.data.caption?.toLowerCase().includes(lf) || item.data.vibe?.toLowerCase().includes(lf);
      });
    }

    if (sortBy === 'recency') {
      result.sort((a, b) => {
        const tA = a.type === 'story' ? new Date(a.data.created_at).getTime() : new Date((a.data as any).updated_at || 0).getTime();
        const tB = b.type === 'story' ? new Date(b.data.created_at).getTime() : new Date((b.data as any).updated_at || 0).getTime();
        return tB - tA;
      });
    } else {
      result.sort((a, b) => (a.data.distance_meters || 0) - (b.data.distance_meters || 0));
    }

    return result;
  }, [feedItems, filterText, sortBy, activeFilter]);

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#e879f9] border-t-transparent" />
      </div>
    );
  }

  const renderVibeCard = (v: VibeUser, id: string) => {
    const liked = likedItems.has(id);
    const saved = savedItems.has(id);
    const likes = 12 + Math.floor(Math.random() * 40);
    const comments = 2 + Math.floor(Math.random() * 15);

    return (
      <div
        key={id}
        className="rounded-[24px] overflow-hidden vv-card-hover"
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isDarkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewProfile && onViewProfile(v.id)}
          >
            <div className="relative">
              <Avatar name={v.name} src={v.profile_privacy === 'private' ? undefined : v.avatar_url} size={44} online />
            </div>
            <div>
              <div className="font-['Syne',sans-serif] font-[700] text-[14px]" style={{ color: isDarkMode ? 'white' : '#0f172a' }}>
                {v.profile_privacy === 'private' ? 'Private User' : v.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={9} className="text-[#e879f9]" />
                <span className="text-[10px] font-[600] text-[#e879f9]">{Math.round(v.distance_meters || 0)}m</span>
                <span className="text-white/20 mx-0.5">·</span>
                <PulseDot size={6} />
                <span className="text-[10px] text-white/30 font-medium">Live</span>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MoreHorizontal size={16} className="text-white/30" />
          </button>
        </div>

        {/* Vibe quote */}
        <div
          className="mx-4 mb-4 p-4 rounded-2xl"
          style={{
            background: isDarkMode ? 'rgba(232,121,249,0.06)' : 'rgba(232,121,249,0.05)',
            border: isDarkMode ? '1px solid rgba(232,121,249,0.15)' : '1px solid rgba(232,121,249,0.2)',
          }}
        >
          <p className="text-[13px] font-medium leading-relaxed italic" style={{ color: isDarkMode ? 'rgba(255,255,255,0.75)' : '#334155' }}>
            "{v.profile_privacy === 'private' ? 'Vibe is private' : v.vibe}"
          </p>
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleLike(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
              style={{
                background: liked ? 'rgba(232,121,249,0.15)' : 'rgba(255,255,255,0.05)',
                border: liked ? '1px solid rgba(232,121,249,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: liked ? '#e879f9' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[11px] font-[600]">{likes + (liked ? 1 : 0)}</span>
            </button>

            {v.chat_privacy !== 'private' && (
              <button
                onClick={() => onViewProfile && onViewProfile(v.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              >
                <MessageCircle size={14} />
                <span className="text-[11px] font-[600]">{comments}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSave(id)}
              className="p-2 rounded-xl transition-all active:scale-90"
              style={{ color: saved ? '#e879f9' : 'rgba(255,255,255,0.3)' }}
            >
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              className="p-2 rounded-xl transition-all active:scale-90"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStoryCard = (s: Story, id: string) => {
    const liked = likedItems.has(id);
    const saved = savedItems.has(id);
    const timeAgo = Math.round((new Date().getTime() - new Date(s.created_at).getTime()) / 60000);
    const timeString = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;

    return (
      <div
        key={id}
        className="rounded-[24px] overflow-hidden vv-card-hover"
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isDarkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewProfile && onViewProfile(s.user_id)}
          >
            <div
              className="p-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)' }}
            >
              <img
                src={`https://picsum.photos/seed/${s.user_id}/80/80`}
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: '#0d0a1e' }}
                alt=""
              />
            </div>
            <div>
              <div className="font-['Syne',sans-serif] font-[700] text-[14px]" style={{ color: isDarkMode ? 'white' : '#0f172a' }}>
                {s.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={9} className="text-[#e879f9]" />
                <span className="text-[10px] font-[600] text-[#e879f9]">{timeString}</span>
              </div>
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[9px] font-[700] uppercase tracking-wider"
            style={{ background: 'rgba(232,121,249,0.1)', border: '1px solid rgba(232,121,249,0.2)', color: '#e879f9' }}
          >
            Story
          </div>
        </div>

        {/* Image */}
        <div className="w-full relative" style={{ aspectRatio: '4/3' }}>
          <img src={s.image_url} className="w-full h-full object-cover" alt="" />
          {s.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
            >
              <p className="text-white text-sm font-medium">{s.caption}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleLike(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
              style={{
                background: liked ? 'rgba(232,121,249,0.15)' : 'rgba(255,255,255,0.05)',
                border: liked ? '1px solid rgba(232,121,249,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: liked ? '#e879f9' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-[11px] font-[600]">{8 + (liked ? 1 : 0)}</span>
            </button>
            <button
              onClick={() => onViewProfile && onViewProfile(s.user_id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              <MessageCircle size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleSave(id)} className="p-2 rounded-xl transition-all active:scale-90" style={{ color: saved ? '#e879f9' : 'rgba(255,255,255,0.3)' }}>
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-xl transition-all active:scale-90" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-3 pb-24 space-y-4">
          {/* Header */}
          <SectionHeader
            title="Vicinity Feed"
            subtitle="What's happening nearby"
            icon={<TrendingUp size={16} />}
            action={
              <button
                onClick={fetchFeed}
                className="text-[11px] font-[700] text-[#e879f9] uppercase tracking-wider hover:text-pink-300 transition-colors"
              >
                Refresh
              </button>
            }
          />

          {/* ─── Filter Row ─────────────────────────────────── */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Filter size={14} className="text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search the feed..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30 font-['DM_Sans',sans-serif]"
            />
          </div>

          {/* ─── Sort / Filter Chips ─────────────────────────── */}
          <div className="flex gap-2">
            {/* Type filters */}
            {(['all', 'vibes', 'stories'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-4 py-2 rounded-xl text-[11px] font-[700] uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: activeFilter === f ? 'rgba(232,121,249,0.2)' : 'rgba(255,255,255,0.05)',
                  border: activeFilter === f ? '1px solid rgba(232,121,249,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: activeFilter === f ? '#e879f9' : 'rgba(255,255,255,0.4)',
                }}
              >
                {f === 'all' ? 'All' : f === 'vibes' ? '⚡ Vibes' : '📸 Stories'}
              </button>
            ))}

            <div className="flex-1" />

            {/* Sort */}
            <button
              onClick={() => setSortBy(s => s === 'recency' ? 'proximity' : 'recency')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-[700] transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              {sortBy === 'recency' ? <Clock size={12} /> : <MapPin size={12} />}
              {sortBy === 'recency' ? 'Recent' : 'Near'}
            </button>
          </div>

          {/* Feed items */}
          {filteredAndSortedItems.map(item =>
            item.type === 'vibe'
              ? renderVibeCard(item.data, item.id)
              : renderStoryCard(item.data, item.id)
          )}

          {filteredAndSortedItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4 opacity-30">🌐</div>
              <p className="text-white/30 text-sm font-medium">
                {filterText ? `No results for "${filterText}"` : 'No vibes nearby. Be the first!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VibeFeedScreen;
