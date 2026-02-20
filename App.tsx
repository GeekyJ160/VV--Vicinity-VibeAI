
import React, { useState, useEffect } from 'react';
import MapScreen from './screens/MapScreen';
import SwipeScreen from './screens/SwipeScreen';
import RouletteScreen from './screens/RouletteScreen';
import PromoDashboardScreen from './screens/PromoDashboardScreen';
import StoriesScreen from './screens/StoriesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import VibeFeedScreen from './screens/VibeFeedScreen';
import { TabType, VibeUser } from './types';
import { MapIcon, FeedIcon, RouletteIcon, PromoIcon, ProfileIcon, HeartIcon, StoryIcon, ChatIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.SWIPE);
  const [userVibe, setUserVibe] = useState<string>("Chill Coding 💻");
  const [selectedChatUser, setSelectedChatUser] = useState<VibeUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const handleStartChat = (user: VibeUser) => {
    setSelectedChatUser(user);
    setActiveTab(TabType.CHAT);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabType.SWIPE: 
        return <SwipeScreen userVibe={userVibe} onMatch={handleStartChat} isDarkMode={isDarkMode} />;
      case TabType.MAP: 
        return <MapScreen isDarkMode={isDarkMode} />;
      case TabType.ROULETTE: 
        return <RouletteScreen onAction={() => setActiveTab(TabType.MAP)} isDarkMode={isDarkMode} />;
      case TabType.STORIES:
        return <StoriesScreen isDarkMode={isDarkMode} />;
      case TabType.TRENDING:
        return <VibeFeedScreen isDarkMode={isDarkMode} />;
      case TabType.PROMOS: 
        return <PromoDashboardScreen isDarkMode={isDarkMode} />;
      case TabType.PROFILE: 
        return <ProfileScreen userVibe={userVibe} onUpdateVibe={setUserVibe} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
      case TabType.CHAT:
        return <ChatScreen user={selectedChatUser} isDarkMode={isDarkMode} />;
      default: 
        return <SwipeScreen userVibe={userVibe} onMatch={handleStartChat} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0F0F23] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`px-6 py-4 border-b flex justify-between items-center shrink-0 shadow-lg z-50 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E1B4B] border-white/10' : 'bg-white border-slate-200'}`}>
        <h1 className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
          VICINITY VIBE
        </h1>
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-500 text-[10px] px-2 py-1 rounded-full font-black">3 BOOSTS</div>
          <button 
            onClick={() => setActiveTab(TabType.PROFILE)}
            className={`w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-amber-500 border-2 transition-transform active:scale-90 ${isDarkMode ? 'border-white/20' : 'border-slate-200'}`}
          >
            <span className="text-sm">🧑‍🚀</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto">
        {renderContent()}
      </main>

      <nav className={`h-20 border-t flex items-center justify-around px-1 shrink-0 z-50 overflow-x-auto scrollbar-hide transition-colors duration-300 ${isDarkMode ? 'bg-[#1E1B4B] border-white/10' : 'bg-white border-slate-200'}`}>
        <NavButton active={activeTab === TabType.SWIPE} onClick={() => setActiveTab(TabType.SWIPE)} icon={<HeartIcon />} label="Swipe" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.MAP} onClick={() => setActiveTab(TabType.MAP)} icon={<MapIcon />} label="Map" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.TRENDING} onClick={() => setActiveTab(TabType.TRENDING)} icon={<FeedIcon />} label="Trends" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.ROULETTE} onClick={() => setActiveTab(TabType.ROULETTE)} icon={<RouletteIcon />} label="Play" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.STORIES} onClick={() => setActiveTab(TabType.STORIES)} icon={<StoryIcon />} label="Live" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.PROMOS} onClick={() => setActiveTab(TabType.PROMOS)} icon={<PromoIcon />} label="Promos" isDarkMode={isDarkMode} />
        <NavButton active={activeTab === TabType.CHAT} onClick={() => setActiveTab(TabType.CHAT)} icon={<ChatIcon />} label="Chat" isDarkMode={isDarkMode} />
      </nav>
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
    className={`flex flex-col items-center justify-center space-y-1 transition-all min-w-[50px] ${active ? 'text-pink-500 scale-110' : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className="shrink-0">{icon}</div>
    <span className="text-[8px] uppercase font-black tracking-tighter whitespace-nowrap">{label}</span>
  </button>
);

export default App;
