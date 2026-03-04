
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
  const [profilePrivacy, setProfilePrivacy] = useState<'everyone' | 'private'>('everyone');
  const [storyPrivacy, setStoryPrivacy] = useState<'everyone' | 'private'>('everyone');
  const [chatPrivacy, setChatPrivacy] = useState<'everyone' | 'private'>('everyone');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!supabase) return;
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
          setProfilePrivacy(profile.profile_privacy || 'everyone');
          setStoryPrivacy(profile.story_privacy || 'everyone');
          setChatPrivacy(profile.chat_privacy || 'everyone');
        }
      } else {
        // Mock profile for bypass
        setName('Demo User');
        onUpdateVibe('Prototyping 🚀');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setName('Demo User');
      onUpdateVibe('Prototyping 🚀');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setIsEditing(false);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        vibe: userVibe,
        discoverable,
        profile_privacy: profilePrivacy,
        story_privacy: storyPrivacy,
        chat_privacy: chatPrivacy,
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
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#e879f9] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-5 animate-in fade-in duration-500 overflow-y-auto pb-24">
      <div className="mb-5">
        <div className="font-['Syne',sans-serif] text-[22px] font-[800] tracking-[-0.5px] mb-1">
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Your </span>
          <span className="text-[#e879f9]">Profile</span>
        </div>
        <div className="text-[12px] font-['DM_Sans',sans-serif] text-white/40 mb-5">
          Manage your vibe and settings
        </div>
      </div>

      <div className="flex flex-col gap-[14px]">
        {/* Profile Card */}
        <div className="p-[20px] rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center font-['Syne',sans-serif] font-[700] text-[24px] text-white shadow-[0_0_20px_rgba(232,121,249,0.4)]"
              style={{
                background: `linear-gradient(135deg, #e879f988, #e879f944)`,
                border: `2px solid #e879f9`
              }}
            >
              {name.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#22c55e] border-[3px] border-[#0d0a1e]" />
          </div>
          
          {isEditing ? (
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-['Syne',sans-serif] font-[800] text-[20px] text-white bg-transparent border-b border-[#e879f9] outline-none text-center mb-1"
              autoFocus
            />
          ) : (
            <div className="font-['Syne',sans-serif] font-[800] text-[20px] text-white mb-1">
              {name}
            </div>
          )}
          <div className="text-[13px] text-[#e879f9] font-['DM_Sans',sans-serif] mb-4">
            {userVibe}
          </div>
          
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-6 py-[8px] rounded-[50px] bg-white/10 border border-white/20 text-white font-['DM_Sans',sans-serif] font-[600] text-[12px] cursor-pointer hover:bg-white/20 transition-colors"
          >
            {isEditing ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        {/* Settings */}
        <div className="p-[20px] rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10 flex flex-col gap-5">
          <div className="font-['Syne',sans-serif] font-[700] text-[15px] text-white mb-1">
            Settings
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-['DM_Sans',sans-serif] font-[600] text-[14px] text-white">Discoverable</div>
              <div className="font-['DM_Sans',sans-serif] text-[11px] text-white/40 mt-1">Show my profile to nearby users</div>
            </div>
            <button 
              onClick={toggleDiscoverable}
              className="w-12 h-6 rounded-full relative transition-colors duration-300"
              style={{ background: discoverable ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
            >
              <div 
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300"
                style={{ transform: discoverable ? 'translateX(24px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-['DM_Sans',sans-serif] font-[600] text-[14px] text-white">Dark Mode</div>
              <div className="font-['DM_Sans',sans-serif] text-[11px] text-white/40 mt-1">Toggle app theme</div>
            </div>
            <button 
              onClick={onToggleTheme}
              className="w-12 h-6 rounded-full relative transition-colors duration-300"
              style={{ background: isDarkMode ? '#e879f9' : 'rgba(255,255,255,0.2)' }}
            >
              <div 
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 flex items-center justify-center"
                style={{ transform: isDarkMode ? 'translateX(24px)' : 'translateX(0)' }}
              >
                <span className="text-[8px]">{isDarkMode ? '🌙' : '☀️'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-[20px] rounded-[20px] bg-white/5 backdrop-blur-[16px] border border-white/10 flex flex-col gap-5">
          <div className="font-['Syne',sans-serif] font-[700] text-[15px] text-white mb-1">
            Privacy
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-['DM_Sans',sans-serif] font-[600] text-[14px] text-white">Profile Details</div>
              <div className="font-['DM_Sans',sans-serif] text-[11px] text-white/40 mt-1">Who can see your bio</div>
            </div>
            <select 
              value={profilePrivacy}
              onChange={(e) => setProfilePrivacy(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[12px] text-white font-['DM_Sans',sans-serif] outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-['DM_Sans',sans-serif] font-[600] text-[14px] text-white">Stories</div>
              <div className="font-['DM_Sans',sans-serif] text-[11px] text-white/40 mt-1">Who can view your posts</div>
            </div>
            <select 
              value={storyPrivacy}
              onChange={(e) => setStoryPrivacy(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[12px] text-white font-['DM_Sans',sans-serif] outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-['DM_Sans',sans-serif] font-[600] text-[14px] text-white">Direct Chat</div>
              <div className="font-['DM_Sans',sans-serif] text-[11px] text-white/40 mt-1">Who can initiate a chat</div>
            </div>
            <select 
              value={chatPrivacy}
              onChange={(e) => setChatPrivacy(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[12px] text-white font-['DM_Sans',sans-serif] outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="private">None</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="mt-2 p-[14px] rounded-[16px] border border-red-500/30 bg-red-500/10 text-red-400 font-['Syne',sans-serif] font-[700] text-[14px] cursor-pointer hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
