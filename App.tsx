
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
import { TabType, VibeUser } from './types';
import { MapIcon, FeedIcon, RouletteIcon, PromoIcon, ProfileIcon, HeartIcon, StoryIcon, ChatIcon } from './components/Icons';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, ExternalLink, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.SWIPE);
  const [userVibe, setUserVibe] = useState<string>("Chill Coding 💻");
  const [selectedChatUser, setSelectedChatUser] = useState<VibeUser | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleStartChat = (user: VibeUser) => {
    setSelectedChatUser(user);
    setActiveTab(TabType.CHAT);
  };

  const handleViewProfile = (userId: string) => {
    setViewingProfileId(userId);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderContent = () => {
    if (!isSupabaseConfigured && !isBypassed) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-700">
          <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
            <Settings className="text-pink-500 animate-spin-slow" size={40} />
          </div>
          <h2 className="text-2xl font-black mb-4 italic tracking-tight">Configuration Required</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            To launch Vicinity Vibe, you need to connect your Supabase project.
          </p>
          
          <div className={`w-full max-w-sm p-6 rounded-3xl border text-left mb-8 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className="text-xs font-black uppercase tracking-widest text-pink-500 mb-4 flex items-center gap-2">
              <AlertCircle size={14} /> Setup Instructions
            </h3>
            <ol className="space-y-4 text-xs font-medium leading-normal">
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-black">1</span>
                <span>Create a project at <a href="https://supabase.com" target="_blank" className="text-pink-500 underline">supabase.com</a></span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-black">2</span>
                <span>Go to <b>Project Settings &gt; API</b></span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-black">3</span>
                <span>Copy <b>Project URL</b> and <b>anon public key</b></span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-black">4</span>
                <span>Add them as environment variables in AI Studio</span>
              </li>
            </ol>
          </div>

          <a 
            href="https://supabase.com/dashboard" 
            target="_blank"
            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
          >
            Open Supabase Dashboard <ExternalLink size={16} />
          </a>

          <button 
            onClick={() => setIsBypassed(true)}
            className="mt-8 text-zinc-500 hover:text-white text-xs underline font-['DM_Sans',sans-serif] transition-colors"
          >
            Developer Bypass (UI Only)
          </button>
        </div>
      );
    }

    if (!session && !isBypassed) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
          <h2 className="text-3xl font-black mb-4">Welcome to Vicinity Vibe</h2>
          <p className="text-zinc-500 mb-8">Connect with people in your immediate vicinity based on shared vibes.</p>
          
          <form 
            className="w-full max-w-sm flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              
              if (!email || !password) return;
              
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              
              if (error && error.message.includes('Invalid login credentials')) {
                // If sign in fails, try signing up
                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) {
                  alert(signUpError.message);
                } else {
                  alert("Account created! You can now sign in.");
                }
              } else if (error) {
                alert(error.message);
              }
            }}
          >
            <input 
              type="email" 
              name="email"
              placeholder="Email address" 
              required
              className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-pink-500 transition-colors ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              required
              className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-pink-500 transition-colors ${isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
            <button 
              type="submit"
              className="bg-pink-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-pink-700 transition-all active:scale-95 mt-2"
            >
              Sign In / Sign Up
            </button>
          </form>

          <div className="relative w-full max-w-sm my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-500/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`px-2 ${isDarkMode ? 'bg-[#0F0F23] text-zinc-500' : 'bg-slate-50 text-slate-400'}`}>OR</span>
            </div>
          </div>

          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className={`w-full max-w-sm flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 border ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200 border-transparent' : 'bg-white text-slate-900 hover:bg-slate-50 border-slate-200 shadow-sm'}`}
          >
            Sign in with GitHub
          </button>

          <button 
            onClick={() => setIsBypassed(true)}
            className="mt-8 text-zinc-500 hover:text-white text-xs underline font-['DM_Sans',sans-serif] transition-colors"
          >
            Developer Bypass (UI Only)
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
      
      {/* Header */}
      <div className="p-[16px_20px] flex justify-between items-center shrink-0">
        <div className="font-['Syne',sans-serif] text-[20px] font-[800] tracking-[-0.5px]">
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Vicinity</span>
          <span className="text-[#e879f9]">Vibe</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-[10px] py-[4px] rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-['DM_Sans',sans-serif] font-[700] text-[#e879f9]">
            3 BOOSTS
          </div>
          <button 
            onClick={() => setActiveTab(TabType.PROFILE)}
            className="w-8 h-8 rounded-full border-none cursor-pointer p-0 overflow-hidden"
          >
            <div 
              className="w-full h-full flex items-center justify-center font-['Syne',sans-serif] font-[700] text-[12px] text-white shadow-[0_0_16px_rgba(232,121,249,0.4)]"
              style={{
                background: `linear-gradient(135deg, #e879f988, #e879f944)`,
                border: `2px solid #e879f9`
              }}
            >
              ME
            </div>
          </button>
        </div>
      </div>

      <main className="flex-1 relative overflow-auto">
        {renderContent()}
      </main>

      {/* Navigation */}
      {(session || isBypassed) && (
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0d0a1e] to-transparent pointer-events-none z-50 flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 p-[8px] rounded-[24px] bg-white/5 backdrop-blur-[16px] border border-white/10 pointer-events-auto">
            <NavButton active={activeTab === TabType.SWIPE} onClick={() => setActiveTab(TabType.SWIPE)} icon={<HeartIcon />} label="Swipe" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.MAP} onClick={() => setActiveTab(TabType.MAP)} icon={<MapIcon />} label="Map" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.TRENDING} onClick={() => setActiveTab(TabType.TRENDING)} icon={<FeedIcon />} label="Feed" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.ROULETTE} onClick={() => setActiveTab(TabType.ROULETTE)} icon={<RouletteIcon />} label="Play" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.STORIES} onClick={() => setActiveTab(TabType.STORIES)} icon={<StoryIcon />} label="Live" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.PROMOS} onClick={() => setActiveTab(TabType.PROMOS)} icon={<PromoIcon />} label="Promos" isDarkMode={isDarkMode} />
            <NavButton active={activeTab === TabType.CHAT} onClick={() => setActiveTab(TabType.CHAT)} icon={<ChatIcon />} label="Chat" isDarkMode={isDarkMode} />
          </div>
        </div>
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isDarkMode: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, isDarkMode }) => (
  <button 
    onClick={onClick}
    className="w-[44px] h-[44px] rounded-[16px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border-none bg-transparent"
    style={{
      background: active ? "rgba(232,121,249,0.15)" : "transparent",
      color: active ? "#e879f9" : "rgba(255,255,255,0.4)"
    }}
  >
    <div className="shrink-0 scale-90">{icon}</div>
    <span className="text-[8px] font-['DM_Sans',sans-serif] font-[700]">{label}</span>
  </button>
);

export default App;
