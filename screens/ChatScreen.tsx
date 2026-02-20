
import React, { useState, useEffect, useRef } from 'react';
import { VibeUser } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'other';
  timestamp: Date;
}

interface ChatScreenProps {
  user: VibeUser | null;
  isDarkMode: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ user, isDarkMode }) => {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting if user is selected
  useEffect(() => {
    if (user) {
      setMessages([
        {
          id: '1',
          text: `Hey! I noticed we're both into ${user.vibe.split(' ')[0]} right now. Want to catch up?`,
          sender: 'other',
          timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
        }
      ]);
    }
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msg.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: msg.trim(),
      sender: 'self',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setMsg('');

    // Simulate reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: "That sounds awesome! I'm just a few blocks away. Where should we meet?",
        sender: 'other',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 2500);
  };

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="text-6xl mb-6 opacity-20">💬</div>
        <h2 className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-400'} italic font-medium`}>
          Start a conversation from the Map or Swipe screens
        </h2>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-transparent overflow-hidden">
      {/* Header */}
      <header className={`px-6 py-4 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-white/5 bg-[#1E1B4B]/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-pink-500 shadow-sm" alt="" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F0F23]"></div>
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</h3>
            <p className="text-[10px] mt-1 text-pink-500 font-black uppercase tracking-widest">
              {isTyping ? 'Typing...' : 'Online Nearby'}
            </p>
          </div>
        </div>
        <button className={`p-2 rounded-full hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-slate-400'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="text-center">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
            Sync established via {user.vibe.split(' ')[0]} vibe
          </span>
        </div>

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.sender === 'self' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all ${
              m.sender === 'self' 
                ? 'bg-gradient-to-br from-pink-600 to-violet-600 text-white rounded-tr-none' 
                : isDarkMode 
                  ? 'bg-zinc-800 text-white border border-white/5 rounded-tl-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              {m.text}
            </div>
            <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-tighter opacity-40 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-2 duration-300">
            <div className={`px-4 py-4 rounded-2xl rounded-tl-none border flex items-center space-x-1 ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 pb-10 transition-colors duration-300 ${isDarkMode ? 'bg-transparent' : 'bg-white border-t border-slate-100'}`}>
        <form 
          onSubmit={handleSendMessage}
          className={`flex items-center space-x-2 rounded-[1.5rem] px-4 py-1.5 border transition-all duration-300 focus-within:ring-2 focus-within:ring-pink-500/30 ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button type="button" className={`p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </button>
          
          <input 
            type="text" 
            placeholder="Type a message..." 
            className={`bg-transparent border-none outline-none flex-1 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />

          <div className="flex items-center">
            {msg.trim() && (
              <button 
                type="submit"
                className="p-2 bg-pink-600 text-white rounded-full transition-all scale-110 shadow-lg shadow-pink-500/30 hover:bg-pink-500 animate-in zoom-in duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            )}
            {!msg.trim() && (
              <button type="button" className={`p-2 transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m4.93 19.07 14.14-14.14"/></svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
