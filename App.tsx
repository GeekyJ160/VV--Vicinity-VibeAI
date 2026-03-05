
import React, { useState, useEffect } from 'react';
import MapScreen from './screens/MapScreen';
import SwipeScreen from './screens/SwipeScreen';
import RouletteScreen from './screens/RouletteScreen';
import PromoDashboardScreen from './screens/PromoDashboardScreen';
import StoriesScreen from './screens/StoriesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import VibeFeedScreen from './screens/VibeFeedScreen';
import PublicProfileModal from './screens/PublicProfileModal';
import SplashScreen from './screens/SplashScreen';
import { TabType, VibeUser } from './types';
import { MapIcon, FeedIcon, RouletteIcon, PromoIcon, HeartIcon, StoryIcon, ChatIcon, VVLogo } from './components/Icons';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, ExternalLink, Settings, Bell, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.SWIPE);
  const [userVibe, setUserVibe] = useState<string>("Chill Coding 💻");
  const [selectedChatUser, setSelectedChatUser] = useState<VibeUser | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [unreadChats, setUnreadChats] = useState<number>(2);
  const [boosts, setBoosts] = useState<number>(3);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStartChat = (user: VibeUser) => {
    setSelectedChatUser(user);
    setActiveTab(TabType.CHAT);
    setUnreadChats(prev => Math.max(0, prev - 1));
  };

  const handleViewProfile = (userId: string) => {
    setViewingProfileId(userId);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // ─── Splash Screen ──────────────────────────────────────────────
  if (showSplash) {
    return (
      <SplashScreen onComplete={() => setShowSplash(false)} />
    );
  }

  const renderContent = () => {
    if (!isSupabaseConfigured && !isBypassed) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center vv-slide-up">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-pink-500/10 rounded-3xl flex items-center justify-center">
              <Settings className="text-pink-500 vv-spin-slow" size={36} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertCircle size={14} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-['Syne',sans-serif] font-[800] mb-2 tracking-tight">Setup Required</h2>
          <p className="text-white/40 text-sm mb-8 max-w-xs leading-relaxed">
            Connect your Supabase project to enable real-time features.
          </p>

          <div className={`w-full max-w-sm p-5 rounded-3xl border text-left mb-6 ${isDarkMode ? 'bg-white/4 border-white/8' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className="text-[10px] font-[800] uppercase tracking-[0.15em] text-pink-500 mb-4 flex items-center gap-2">
              <AlertCircle size={12} /> Quick Setup
            </h3>
            <ol className="space-y-3 text-xs font-medium leading-relaxed">
              {[
                'Create a project at supabase.com',
                'Go to Project Settings → API',
                'Copy Project URL & anon public key',
                'Add as VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-[800] text-[10px]">{i + 1}</span>
                  <span className="text-white/60">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            className="flex items-center gap-2 vv-gradient-bg text-white px-8 py-4 rounded-2xl font-[700] uppercase tracking-widest text-[13px] active:scale-95 transition-transform mb-4 w-full max-w-sm justify-center"
          >
            Open Supabase <ExternalLink size={14} />
          </a>

          <button
            onClick={() => setIsBypassed(true)}
            className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors underline underline-offset-4"
          >
            Developer Preview (UI Only)
          </button>
        </div>
      );
    }

    if (!session && !isBypassed) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-8 vv-float">
            <VVLogo size={72} animated />
          </div>
          <h2 className="text-3xl font-['Syne',sans-serif] font-[800] tracking-tight mb-2">
            Welcome to <span className="vv-shimmer-text">VV</span>
          </h2>
          <p className="text-white/40 text-sm mb-10 max-w-xs leading-relaxed">
            Discover people in your vicinity, match vibes, explore together.
          </p>

          <form
            className="w-full max-w-sm flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              if (!email || !password) return;
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error && error.message.includes('Invalid login credentials')) {
                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) alert(signUpError.message);
                else alert("Account created! Check your email to verify.");
              } else if (error) {
                alert(error.message);
              }
            }}
          >
            <input
              type="email" name="email"
              placeholder="Email address"
              required
              className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-pink-500/60 focus:bg-white/8 transition-all placeholder:text-white/30"
            />
            <input
              type="password" name="password"
              placeholder="Password"
              required
              className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-pink-500/60 focus:bg-white/8 transition-all placeholder:text-white/30"
            />
            <button
              type="submit"
              className="vv-gradient-bg text-white px-8 py-4 rounded-2xl font-[700] uppercase tracking-widest text-[13px] mt-1 active:scale-95 transition-transform"
            >
              Continue →
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 w-full max-w-sm">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-[700] text-[13px] tracking-wide transition-all active:scale-95 bg-white/8 border border-white/12 text-white hover:bg-white/12"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Sign in with GitHub
          </button>

          <button
            onClick={() => setIsBypassed(true)}
            className="mt-8 text-white/25 hover:text-white/50 text-xs font-medium transition-colors underline underline-offset-4"
          >
            Developer Preview
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case TabType.SWIPE:
        return <SwipeScreen userVibe={userVibe} onMatch={handleStartChat} isDarkMode={isDarkMode} onViewProfile={handleViewProfile} />;
      case TabType.MAP:
        return <MapScreen isDarkMode={isDarkMode} />;
      case TabType.ROULETTE:
        return <RouletteScreen onAction={() => setActiveTab(TabType.MAP)} isDarkMode={isDarkMode} />;
      case TabType.STORIES:
        return <StoriesScreen isDarkMode={isDarkMode} onViewProfile={handleViewProfile} />;
      case TabType.TRENDING:
        return <VibeFeedScreen isDarkMode={isDarkMode} onViewProfile={handleViewProfile} />;
      case TabType.PROMOS:
        return <PromoDashboardScreen isDarkMode={isDarkMode} />;
      case TabType.PROFILE:
        return <ProfileScreen userVibe={userVibe} onUpdateVibe={setUserVibe} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
      case TabType.CHAT:
        return <ChatScreen user={selectedChatUser} isDarkMode={isDarkMode} onSelectUser={setSelectedChatUser} />;
      default:
        return <SwipeScreen userVibe={userVibe} onMatch={handleStartChat} isDarkMode={isDarkMode} onViewProfile={handleViewProfile} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0d0a1e] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, #e879f9, transparent)' }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-8"
          style={{ width: 300, height: 300, bottom: 50, left: -80, background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        />
      </div>

      {/* Public Profile Modal */}
      {viewingProfileId && (
        <PublicProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
          onStartChat={(user) => {
            setViewingProfileId(null);
            handleStartChat(user);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className={`relative z-10 px-5 pt-4 pb-3 flex justify-between items-center shrink-0 ${isDarkMode ? '' : 'border-b border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <VVLogo size={34} />
          <div>
            <div className="font-['Syne',sans-serif] text-[17px] font-[800] tracking-[-0.5px] leading-none">
              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Vicinity</span>
              <span className="vv-shimmer-text"> Vibe</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">Live · 247 nearby</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Boosts badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-[700] uppercase tracking-wider"
            style={{ background: 'rgba(232,121,249,0.12)', border: '1px solid rgba(232,121,249,0.25)', color: '#e879f9' }}
          >
            <Zap size={10} fill="currentColor" />
            {boosts} Boosts
          </div>

          {/* Avatar */}
          <button
            onClick={() => setActiveTab(TabType.PROFILE)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-['Syne',sans-serif] font-[700] text-[11px] text-white active:scale-95 transition-transform relative"
            style={{
              background: 'linear-gradient(135deg, #e879f988, #e879f944)',
              border: '2px solid #e879f9',
              boxShadow: '0 0 12px rgba(232,121,249,0.35)'
            }}
          >
            ME
            {/* Notification dot */}
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0d0a1e]"
            />
          </button>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden z-10">
        {renderContent()}
      </main>

      {/* ─── Bottom Navigation ───────────────────────────────────── */}
      {(session || isBypassed) && (
        <div className={`relative z-20 shrink-0 px-3 pb-safe pb-4 pt-2 ${isDarkMode ? '' : 'border-t border-slate-200'}`}>
          <div
            className="flex items-center justify-around p-2 rounded-[28px] mx-auto max-w-sm"
            style={{
              background: isDarkMode
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
            }}
          >
            <NavButton active={activeTab === TabType.SWIPE} onClick={() => setActiveTab(TabType.SWIPE)} icon={<HeartIcon />} label="Swipe" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.MAP} onClick={() => setActiveTab(TabType.MAP)} icon={<MapIcon />} label="Map" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.TRENDING} onClick={() => setActiveTab(TabType.TRENDING)} icon={<FeedIcon />} label="Feed" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.ROULETTE} onClick={() => setActiveTab(TabType.ROULETTE)} icon={<RouletteIcon />} label="Play" isDarkMode={isDarkMode} isCenter />
            <NavButton active={activeTab === TabType.STORIES} onClick={() => setActiveTab(TabType.STORIES)} icon={<StoryIcon />} label="Live" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.PROMOS} onClick={() => setActiveTab(TabType.PROMOS)} icon={<PromoIcon />} label="Deals" isDarkMode={isDarkMode} />
            <NavButton
              active={activeTab === TabType.CHAT}
              onClick={() => setActiveTab(TabType.CHAT)}
              icon={<ChatIcon />}
              label="Chat"
              isDarkMode={isDarkMode}
              badge={unreadChats}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Nav Button ──────────────────────────────────────────────────
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isDarkMode: boolean;
  isCenter?: boolean;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, isDarkMode, isCenter, badge }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
    style={{
      width: isCenter ? 52 : 44,
      height: isCenter ? 52 : 44,
      borderRadius: isCenter ? 18 : 14,
      background: active
        ? isCenter
          ? 'linear-gradient(135deg, #e879f9, #a855f7)'
          : 'rgba(232,121,249,0.18)'
        : isCenter
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
      color: active ? '#e879f9' : isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
      boxShadow: active && isCenter ? '0 4px 14px rgba(232,121,249,0.4)' : 'none',
    }}
  >
    <div style={{ color: active && isCenter ? '#fff' : 'inherit' }} className="scale-90">{icon}</div>
    <span
      className="text-[7px] font-[700] uppercase tracking-wider"
      style={{ color: active && isCenter ? '#fff' : 'inherit' }}
    >
      {label}
    </span>
    {badge && badge > 0 ? (
      <div
        className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-[800] text-white"
        style={{ background: '#e879f9', padding: '0 3px' }}
      >
        {badge}
      </div>
    ) : null}
  </button>
);

export default App;
