
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { VibeUser } from '../types';
import { X, MapPin, Heart, MessageCircle, Sparkles, ShieldAlert, Star, Share2 } from 'lucide-react';
import { Avatar, VibeBadge, PulseDot, ScoreRing } from '../components/Icons';

interface PublicProfileModalProps {
  userId: string;
  onClose: () => void;
  onStartChat: (user: VibeUser) => void;
  isDarkMode: boolean;
}

const MOCK_PROFILES: Record<string, VibeUser> = {
  'm1': { id: 'm1', name: 'Alex Chen', vibe: 'Coffee & Code ☕', avatar_url: 'https://picsum.photos/seed/alex/600/600', distance_meters: 1200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  'm2': { id: 'm2', name: 'Sam Rivera', vibe: 'Live Music 🎸', avatar_url: 'https://picsum.photos/seed/sam/600/600', distance_meters: 800, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 } as any,
  'm3': { id: 'm3', name: 'Jordan K.', vibe: 'Nightlife 🌙', avatar_url: 'https://picsum.photos/seed/jordan/600/600', distance_meters: 3000, profile_privacy: 'private', chat_privacy: 'private', story_privacy: 'private', lat: 0, lng: 0 } as any,
};

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, onClose, onStartChat, isDarkMode }) => {
  const [profile, setProfile] = useState<VibeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => { fetchProfile(); }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const { latitude, longitude } = pos.coords;

      if (!supabase) throw new Error('No Supabase');
      const { data: nearbyUsers, error: rpcError } = await supabase.rpc('nearby_users', { lat: latitude, lng: longitude, radius_meters: 50000 });
      if (rpcError) throw rpcError;

      const foundUser = nearbyUsers?.find((u: any) => u.id === userId);
      if (foundUser) { setProfile(foundUser); return; }

      const { data, error: fetchError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (fetchError) throw fetchError;
      if (data?.discoverable === false) setError("This user's profile is private.");
      else if (data) setProfile({ ...data, distance_meters: undefined });
    } catch {
      const mock = MOCK_PROFILES[userId];
      if (mock) setProfile(mock);
      else setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(13,10,30,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#e879f9] border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-4" style={{ background: 'rgba(13,10,30,0.85)', backdropFilter: 'blur(16px)' }}>
        <div
          className="w-full max-w-sm rounded-[28px] p-6 text-center vv-slide-up"
          style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <ShieldAlert className="text-red-400" size={28} />
          </div>
          <h2 className="text-lg font-['Syne',sans-serif] font-[800] text-white mb-2">Profile Unavailable</h2>
          <p className="text-white/40 text-sm mb-5">{error || "Profile not found."}</p>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-[700] text-[13px] text-white transition-all active:scale-98"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const score = (profile as any).score || 0.78;
  const isPrivate = profile.profile_privacy === 'private';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4"
      style={{ background: 'rgba(13,10,30,0.85)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] overflow-hidden relative vv-slide-up"
        style={{ background: '#0d0a1e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header image */}
        <div className="relative" style={{ aspectRatio: '4/3' }}>
          <img
            src={isPrivate
              ? `https://picsum.photos/seed/private${profile.id}/600/450?blur=10`
              : (profile.avatar_url || `https://picsum.photos/seed/${profile.id}/600/450`)}
            className="w-full h-full object-cover"
            alt={profile.name}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,10,30,1) 0%, rgba(13,10,30,0.3) 50%, transparent 100%)' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <X size={16} className="text-white" />
          </button>

          {/* Score */}
          <div className="absolute top-3 left-3">
            <ScoreRing score={score} size={48} />
          </div>

          {/* Name at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PulseDot size={7} />
                  <span className="text-[10px] text-green-400 font-[600] uppercase tracking-wider">Active Now</span>
                </div>
                <h2 className="font-['Syne',sans-serif] font-[800] text-[24px] text-white tracking-tight leading-none">
                  {isPrivate ? 'Private User' : profile.name}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-5 pt-3 space-y-4">
          {/* Vibe */}
          <div
            className="p-4 rounded-2xl"
            style={{ background: 'rgba(232,121,249,0.07)', border: '1px solid rgba(232,121,249,0.15)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} className="text-[#e879f9]" />
              <span className="text-[10px] font-[700] text-[#e879f9] uppercase tracking-widest">Current Vibe</span>
            </div>
            <p className="text-white/80 text-[14px] font-medium italic leading-relaxed">
              "{isPrivate ? 'Vibe is hidden' : profile.vibe}"
            </p>
          </div>

          {/* Distance */}
          {profile.distance_meters !== undefined && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#e879f9]" />
              <span className="text-[12px] font-[600] text-white/50">{Math.round(profile.distance_meters)}m away</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {profile.chat_privacy !== 'private' ? (
              <button
                onClick={() => { onClose(); onStartChat(profile); }}
                className="flex-1 py-3.5 rounded-2xl font-[700] text-[13px] text-white transition-all active:scale-97 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)', boxShadow: '0 4px 16px rgba(232,121,249,0.35)' }}
              >
                <MessageCircle size={16} />
                Start Chat
              </button>
            ) : (
              <div
                className="flex-1 py-3.5 rounded-2xl font-[700] text-[13px] flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                <MessageCircle size={16} />
                Chat Disabled
              </div>
            )}

            <button
              onClick={() => setLiked(!liked)}
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{
                background: liked ? 'rgba(232,121,249,0.15)' : 'rgba(255,255,255,0.06)',
                border: liked ? '1px solid rgba(232,121,249,0.3)' : '1px solid rgba(255,255,255,0.1)',
                color: liked ? '#e879f9' : 'rgba(255,255,255,0.5)',
              }}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>

            <button
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileModal;
