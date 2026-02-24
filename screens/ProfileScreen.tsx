
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogOut, User, Settings, Shield, Zap, Award } from 'lucide-react';

interface ProfileScreenProps {
  userVibe: string;
  onUpdateVibe: (v: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userVibe, onUpdateVibe, isDarkMode, onToggleTheme }) => {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [discoverable, setDiscoverable] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setName(profile.name || 'Vicinity Voyager');
        onUpdateVibe(profile.vibe || 'Chilling in the city 🌃');
        setDiscoverable(profile.discoverable !== false);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        vibe: userVibe,
        discoverable,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      setIsEditing(false);
    }
  };

  const toggleDiscoverable = async () => {
    const newValue = !discoverable;
    setDiscoverable(newValue);
    if (user) {
      await supabase
        .from('profiles')
        .update({ discoverable: newValue })
        .eq('id', user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full scrollbar-hide">
      {/* Profile Header Card */}
      <div className={`p-8 rounded-[2.5rem] border text-center relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#1E1B4B] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 blur-2xl"></div>
        
        <div className="relative inline-block group">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 p-1.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className={`w-full h-full rounded-full flex items-center justify-center text-5xl overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <img src={user?.user_metadata?.avatar_url || 'https://picsum.photos/id/64/120/120'} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
          <div className={`absolute bottom-1 right-1 bg-green-500 w-7 h-7 rounded-full border-4 ${isDarkMode ? 'border-[#1E1B4B]' : 'border-white'} shadow-md`}></div>
        </div>

        <div className="mt-6 space-y-1">
          {isEditing ? (
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`text-2xl font-black italic text-center w-full bg-transparent border-b-2 border-pink-500 outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              autoFocus
            />
          ) : (
            <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{name}</h2>
          )}
          <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-400'} text-xs font-bold uppercase tracking-[0.2em]`}>Verified Vibe Master</p>
        </div>

        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`mt-6 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {isEditing ? '💾 Save Profile' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* Vibe & Theme Section */}
      <div className="space-y-4">
        <div className={`${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-3xl border`}>
          <h3 className="text-xs font-black uppercase text-pink-500 tracking-widest mb-4">Current Vicinity Vibe</h3>
          <input 
            type="text" 
            value={userVibe}
            onChange={(e) => onUpdateVibe(e.target.value)}
            placeholder="Ex: Chill Coffee, 90s Vinyl, Park Jog..." 
            className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-sm font-medium transition-colors ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          />
          <p className="text-[10px] text-zinc-500 mt-2 font-medium italic">"Your vibe is visible to anyone within 10km."</p>
        </div>

        <div className={`${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-3xl border flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <Shield className="text-emerald-500" size={20} />
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Discoverable</h3>
              <p className="text-[10px] text-zinc-500">Show my profile to nearby users</p>
            </div>
          </div>
          <button 
            onClick={toggleDiscoverable}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${discoverable ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-sm ${discoverable ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>

        <div className={`${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-3xl border flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <Settings className="text-pink-500" size={20} />
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dark Mode</h3>
              <p className="text-[10px] text-zinc-500">Save battery & look mysterious</p>
            </div>
          </div>
          <button 
            onClick={onToggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-pink-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-sm flex items-center justify-center overflow-hidden ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}>
               {isDarkMode ? <span className="text-[10px]">🌙</span> : <span className="text-[10px]">☀️</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${isDarkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-2xl border text-center group hover:border-pink-500/50 transition-colors`}>
           <Award className="text-pink-500 mx-auto mb-2" size={24} />
           <div className="text-2xl font-black text-pink-500">24</div>
           <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Vibe Syncs</div>
        </div>
        <div className={`${isDarkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-2xl border text-center group hover:border-amber-500/50 transition-colors`}>
           <Zap className="text-amber-500 mx-auto mb-2" size={24} />
           <div className="text-2xl font-black text-amber-500">482</div>
           <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Vicinity Reach</div>
        </div>
      </div>
      
      <div className="text-center pb-8">
        <button 
          onClick={handleSignOut}
          className="flex items-center justify-center space-x-2 w-full py-4 text-xs font-black text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-widest border border-red-500/20 rounded-2xl"
        >
          <LogOut size={16} />
          <span>Sign Out of Vicinity</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
