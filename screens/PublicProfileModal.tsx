import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { VibeUser } from '../types';
import { X, MapPin, Heart, MessageCircle, Sparkles, ShieldAlert } from 'lucide-react';

interface PublicProfileModalProps {
  userId: string;
  onClose: () => void;
  onStartChat: (user: VibeUser) => void;
  isDarkMode: boolean;
}

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, onClose, onStartChat, isDarkMode }) => {
  const [profile, setProfile] = useState<VibeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current location to calculate distance
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = pos.coords;

      // Use the RPC to get distance, or fallback to standard select if not nearby
      const { data: nearbyUsers, error: rpcError } = await supabase.rpc('nearby_users', {
        lat: latitude,
        lng: longitude,
        radius_meters: 50000 // 50km radius to find them
      });

      if (rpcError) throw rpcError;

      const foundUser = nearbyUsers?.find((u: any) => u.id === userId);

      if (foundUser) {
        setProfile(foundUser);
      } else {
        // Fallback: fetch directly if they aren't in the nearby radius (or if discoverable is false, though we shouldn't show them then)
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (fetchError) throw fetchError;
        
        if (data && data.discoverable === false) {
          setError("This user's profile is private.");
        } else if (data) {
          setProfile({
            ...data,
            distance_meters: undefined // Unknown distance
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-6">
        <div className={`w-full max-w-sm rounded-[3rem] p-8 text-center relative shadow-2xl ${isDarkMode ? 'bg-zinc-900 border border-white/10' : 'bg-white'}`}>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-pink-500 transition-colors">
            <X size={20} />
          </button>
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <h2 className={`text-xl font-black italic mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Profile Unavailable</h2>
          <p className="text-sm text-zinc-500 mb-8">{error || "This profile could not be found."}</p>
          <button onClick={onClose} className="w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-white py-4 rounded-2xl font-black uppercase tracking-widest">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-6">
      <div className={`w-full max-w-sm rounded-[3rem] overflow-hidden relative shadow-2xl border ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Image / Avatar */}
        <div className="w-full aspect-square relative bg-zinc-100 dark:bg-zinc-800">
          <img 
            src={profile.avatar_url || `https://picsum.photos/seed/${profile.id}/600/600`} 
            className="w-full h-full object-cover" 
            alt={profile.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h2 className="text-3xl font-black text-white italic tracking-tight">{profile.name}</h2>
            
            {profile.distance_meters !== undefined && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1">
                  <MapPin className="text-pink-400" size={12} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {Math.round(profile.distance_meters)}m away
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-2 flex items-center gap-1">
              <Sparkles size={12} /> Current Vibe
            </h3>
            <p className={`text-lg font-medium italic ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
              "{profile.vibe}"
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button 
              onClick={() => {
                onClose();
                onStartChat(profile);
              }}
              className="flex-1 bg-pink-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/20 active:scale-95"
            >
              <MessageCircle size={18} /> Chat
            </button>
            <button className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors border ${isDarkMode ? 'bg-zinc-800 border-white/10 text-white hover:bg-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileModal;
