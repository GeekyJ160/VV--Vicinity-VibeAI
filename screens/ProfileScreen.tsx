
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogOut, Camera, Bell, Shield, Moon, Sun, Zap, Award, Edit3, Check, ChevronRight, Globe, Lock } from 'lucide-react';
import { VVLogo, Avatar, VibeBadge, StatPill } from '../components/Icons';
import { MapPin, Heart, MessageCircle } from 'lucide-react';

interface ProfileScreenProps {
  userVibe: string;
  onUpdateVibe: (v: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userVibe, onUpdateVibe, isDarkMode, onToggleTheme }) => {
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingVibe, setIsEditingVibe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [discoverable, setDiscoverable] = useState(true);
  const [profilePrivacy, setProfilePrivacy] = useState<'everyone' | 'private'>('everyone');
  const [storyPrivacy, setStoryPrivacy] = useState<'everyone' | 'private'>('everyone');
  const [chatPrivacy, setChatPrivacy] = useState<'everyone' | 'private'>('everyone');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('No Supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setName(profile.name || 'Vicinity Voyager');
          onUpdateVibe(profile.vibe || 'Chilling 🌃');
          setDiscoverable(profile.discoverable !== false);
          setProfilePrivacy(profile.profile_privacy || 'everyone');
          setStoryPrivacy(profile.story_privacy || 'everyone');
          setChatPrivacy(profile.chat_privacy || 'everyone');
        }
      } else {
        setName('Demo User');
        onUpdateVibe('Prototyping 🚀');
      }
    } catch {
      setName('Demo User');
      onUpdateVibe('Prototyping 🚀');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    if (user && supabase) {
      await supabase.from('profiles').update({
        name, vibe: userVibe, discoverable,
        profile_privacy: profilePrivacy,
        story_privacy: storyPrivacy,
        chat_privacy: chatPrivacy,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    }
    setIsEditingName(false);
    setIsEditingVibe(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const toggleDiscoverable = async () => {
    const v = !discoverable;
    setDiscoverable(v);
    if (user && supabase) {
      await supabase.from('profiles').update({ discoverable: v }).eq('id', user.id);
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
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#e879f9] border-t-transparent" />
      </div>
    );
  }

  const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-5 py-4 flex items-center gap-2 border-b border-white/5">
        <div className="text-[#e879f9]">{icon}</div>
        <span className="font-['Syne',sans-serif] font-[700] text-[13px] text-white">{title}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );

  const SettingRow: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
    <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/4 transition-colors">
      <div>
        <div className="text-[13px] font-[600] text-white">{label}</div>
        {desc && <div className="text-[11px] text-white/35 mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );

  const Toggle: React.FC<{ value: boolean; onChange: () => void; color?: string }> = ({ value, onChange, color = '#22c55e' }) => (
    <button
      onClick={onChange}
      className="relative transition-all active:scale-95"
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? color : 'rgba(255,255,255,0.15)' }}
    >
      <div
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-250"
        style={{ left: value ? 24 : 4, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
      />
    </button>
  );

  const PrivacySelect: React.FC<{ value: 'everyone' | 'private'; onChange: (v: 'everyone' | 'private') => void }> = ({ value, onChange }) => (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
      {([['everyone', <Globe size={11} />, 'All'], ['private', <Lock size={11} />, 'None']] as const).map(([v, icon, label]) => (
        <button
          key={v}
          onClick={() => onChange(v as 'everyone' | 'private')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-[700] transition-all"
          style={{
            background: value === v ? 'rgba(232,121,249,0.2)' : 'transparent',
            color: value === v ? '#e879f9' : 'rgba(255,255,255,0.4)',
            border: value === v ? '1px solid rgba(232,121,249,0.3)' : '1px solid transparent',
          }}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-24">
      <div className="px-4 pt-3 pb-6 space-y-4">

        {/* ─── Profile Hero ─────────────────────────────────── */}
        <div
          className="rounded-[24px] overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Banner gradient */}
          <div
            className="h-24 w-full relative"
            style={{ background: 'linear-gradient(135deg, rgba(232,121,249,0.3) 0%, rgba(124,58,237,0.3) 50%, rgba(13,10,30,0.8) 100%)' }}
          >
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(232,121,249,0.6), transparent 60%), radial-gradient(circle at 70% 50%, rgba(124,58,237,0.6), transparent 60%)'
            }} />
          </div>

          {/* Avatar & info */}
          <div className="px-5 pb-5 -mt-10 relative">
            <div className="flex items-end justify-between mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-[22px] flex items-center justify-center text-white font-['Syne',sans-serif] font-[800] text-[24px] relative"
                  style={{
                    background: 'linear-gradient(135deg, #e879f988, #e879f944)',
                    border: '3px solid #0d0a1e',
                    boxShadow: '0 0 20px rgba(232,121,249,0.4)',
                    outline: '2px solid rgba(232,121,249,0.3)',
                  }}
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-[#0d0a1e] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-200" />
                </div>
              </div>

              <button
                onClick={() => isEditingName || isEditingVibe ? handleSave() : setIsEditingName(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-[700] transition-all active:scale-95"
                style={{
                  background: saveStatus === 'saved' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                  border: saveStatus === 'saved' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.12)',
                  color: saveStatus === 'saved' ? '#22c55e' : 'rgba(255,255,255,0.7)',
                }}
              >
                {saveStatus === 'saved' ? <Check size={14} /> : saveStatus === 'saving' ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Edit3 size={14} />}
                {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : isEditingName || isEditingVibe ? 'Save' : 'Edit'}
              </button>
            </div>

            {/* Name */}
            {isEditingName ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-['Syne',sans-serif] font-[800] text-[22px] text-white bg-transparent border-b-2 border-[#e879f9] outline-none w-full mb-2"
                autoFocus
              />
            ) : (
              <h2 className="font-['Syne',sans-serif] font-[800] text-[22px] text-white tracking-tight mb-1.5">
                {name}
              </h2>
            )}

            {/* Vibe */}
            {isEditingVibe ? (
              <input
                type="text"
                value={userVibe}
                onChange={(e) => onUpdateVibe(e.target.value)}
                className="bg-transparent border-b border-[#e879f9]/50 outline-none text-sm text-[#e879f9] w-full mb-3"
                placeholder="What's your vibe?"
              />
            ) : (
              <button
                onClick={() => setIsEditingVibe(true)}
                className="mb-3"
              >
                <VibeBadge vibe={userVibe} />
              </button>
            )}

            {/* Stats */}
            <div className="flex gap-2 mt-1">
              <StatPill icon={<Heart size={12} />} label="Matches" value="24" />
              <StatPill icon={<MessageCircle size={12} />} label="Chats" value="8" />
              <StatPill icon={<MapPin size={12} />} label="Radius" value="10km" />
            </div>
          </div>
        </div>

        {/* ─── Appearance ───────────────────────────────────── */}
        <SectionCard title="Appearance" icon={isDarkMode ? <Moon size={14} /> : <Sun size={14} />}>
          <SettingRow label="Dark Mode" desc="Toggle light / dark theme">
            <Toggle value={isDarkMode} onChange={onToggleTheme} color="#e879f9" />
          </SettingRow>
        </SectionCard>

        {/* ─── Discovery ───────────────────────────────────── */}
        <SectionCard title="Discovery" icon={<MapPin size={14} />}>
          <SettingRow label="Discoverable" desc="Appear on nearby users' maps & feeds">
            <Toggle value={discoverable} onChange={toggleDiscoverable} />
          </SettingRow>
          <SettingRow label="Boost Profile" desc="Appear at top of nearby feeds">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-[700]"
              style={{ background: 'rgba(232,121,249,0.15)', border: '1px solid rgba(232,121,249,0.3)', color: '#e879f9' }}
            >
              <Zap size={12} />3 Left
            </button>
          </SettingRow>
        </SectionCard>

        {/* ─── Privacy ─────────────────────────────────────── */}
        <SectionCard title="Privacy" icon={<Shield size={14} />}>
          <SettingRow label="Profile" desc="Who can see your details">
            <PrivacySelect value={profilePrivacy} onChange={(v) => { setProfilePrivacy(v); handleSave(); }} />
          </SettingRow>
          <SettingRow label="Stories" desc="Who can view your posts">
            <PrivacySelect value={storyPrivacy} onChange={(v) => { setStoryPrivacy(v); handleSave(); }} />
          </SettingRow>
          <SettingRow label="Direct Chat" desc="Who can start a conversation">
            <PrivacySelect value={chatPrivacy} onChange={(v) => { setChatPrivacy(v); handleSave(); }} />
          </SettingRow>
        </SectionCard>

        {/* ─── Notifications ───────────────────────────────── */}
        <SectionCard title="Notifications" icon={<Bell size={14} />}>
          <SettingRow label="New Matches" desc="Vibe sync alerts">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow label="Nearby Events" desc="Events within your radius">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow label="Messages" desc="New chat messages">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
        </SectionCard>

        {/* ─── Achievements ────────────────────────────────── */}
        <SectionCard title="Achievements" icon={<Award size={14} />}>
          <div className="px-3 py-2 grid grid-cols-3 gap-2">
            {[
              { emoji: '🔥', label: 'Vibe Hot', desc: '10+ matches' },
              { emoji: '🌐', label: 'Explorer', desc: 'Visited 5 zones' },
              { emoji: '⚡', label: 'Quick Sync', desc: '< 5s match' },
            ].map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-[10px] font-[700] text-white text-center">{a.label}</span>
                <span className="text-[9px] text-white/30 text-center">{a.desc}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ─── Sign Out ─────────────────────────────────────── */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] font-[700] text-[14px] transition-all active:scale-98"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>

        {/* Version */}
        <p className="text-center text-white/15 text-[10px] font-medium uppercase tracking-widest">
          VV Vicinity Vibe · v1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfileScreen;
