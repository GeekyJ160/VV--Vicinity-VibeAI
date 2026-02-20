
import React, { useState } from 'react';

interface ProfileScreenProps {
  userVibe: string;
  onUpdateVibe: (v: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userVibe, onUpdateVibe, isDarkMode, onToggleTheme }) => {
  const [name, setName] = useState('Vicinity Voyager');
  const [bio, setBio] = useState('Exploring the best local energy one vibe at a time. 🚀');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header Card */}
      <div className={`p-8 rounded-[2.5rem] border text-center relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#1E1B4B] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 blur-2xl"></div>
        
        <div className="relative inline-block group">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 p-1.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className={`w-full h-full rounded-full flex items-center justify-center text-5xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              🧑‍🚀
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

        <div className="mt-4">
           {isEditing ? (
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`text-sm text-center w-full bg-transparent border-b border-zinc-500/30 outline-none resize-none h-16 ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}
            />
          ) : (
            <p className={`text-sm px-4 ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>{bio}</p>
          )}
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
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
          <p className="text-[10px] text-zinc-500 mt-2 font-medium italic">"Your vibe is visible to anyone within 1 mile."</p>
        </div>

        <div className={`${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-3xl border flex items-center justify-between`}>
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dark Mode</h3>
            <p className="text-[10px] text-zinc-500">Save battery & look mysterious</p>
          </div>
          <button 
            onClick={onToggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-pink-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-lg flex items-center justify-center overflow-hidden ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}>
               {isDarkMode ? <span className="text-[10px]">🌙</span> : <span className="text-[10px]">☀️</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Boost Management */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30' : 'bg-gradient-to-br from-amber-50 to-transparent border-amber-200 shadow-md'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-amber-500 font-black uppercase tracking-widest text-sm">Vicinity Boost</h3>
            <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} text-xs mt-1`}>Be the #1 Vibe in your area for 30 min.</p>
          </div>
          <div className="bg-amber-500 text-white text-[10px] px-2 py-1 rounded-md font-black">3 REMAINING</div>
        </div>
        
        <button className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 text-white hover:scale-[1.02] active:scale-95 transition-all">
          ⚡ ACTIVATE BOOST NOW
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${isDarkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-2xl border text-center group hover:border-pink-500/50 transition-colors`}>
           <div className="text-2xl font-black text-pink-500">24</div>
           <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Total Matches</div>
        </div>
        <div className={`${isDarkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-2xl border text-center group hover:border-amber-500/50 transition-colors`}>
           <div className="text-2xl font-black text-amber-500">482</div>
           <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Profile Views</div>
        </div>
      </div>
      
      <div className="text-center pb-8">
        <button className="text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-widest">
          Sign Out of Vicinity
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
