
import React, { useState, useEffect, useRef } from 'react';
import { VibeUser, Message } from '../types';
import { supabase } from '../supabaseClient';
import { Send, MoreVertical, MapPin } from 'lucide-react';

interface ChatScreenProps {
  user: VibeUser | null;
  isDarkMode: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ user, isDarkMode }) => {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!user || !currentUser) return;

    fetchMessages();

    const channel = supabase.channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${user.id},receiver_id=eq.${currentUser.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${currentUser.id},receiver_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentUser]);

  const fetchMessages = async () => {
    if (!user || !currentUser) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msg.trim() || !user || !currentUser) return;

    const text = msg.trim();
    setMsg('');

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: user.id,
      content: text
    });

    if (error) {
      console.error('Error sending message:', error);
    }
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
      <header className={`px-6 py-4 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-white/5 bg-[#1E1B4B]/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={user.avatar_url || 'https://picsum.photos/id/64/40/40'} className="w-10 h-10 rounded-full border-2 border-pink-500 shadow-sm" alt="" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F0F23]"></div>
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</h3>
            <p className="text-[10px] mt-1 text-pink-500 font-black uppercase tracking-widest">Online Nearby</p>
          </div>
        </div>
        <button className={`p-2 rounded-full hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-slate-400'}`}>
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="text-center">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
            Sync established via {user.vibe.split(' ')[0]} vibe
          </span>
        </div>

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.sender_id === currentUser?.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all ${
              m.sender_id === currentUser?.id 
                ? 'bg-gradient-to-br from-pink-600 to-violet-600 text-white rounded-tr-none' 
                : isDarkMode 
                  ? 'bg-zinc-800 text-white border border-white/5 rounded-tl-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              {m.content}
            </div>
            <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-tighter opacity-40 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 pb-10 transition-colors duration-300 ${isDarkMode ? 'bg-transparent' : 'bg-white border-t border-slate-100'}`}>
        <form 
          onSubmit={handleSendMessage}
          className={`flex items-center space-x-2 rounded-[1.5rem] px-4 py-1.5 border transition-all duration-300 focus-within:ring-2 focus-within:ring-pink-500/30 ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button type="button" className={`p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}>
            <MapPin size={20} />
          </button>
          
          <input 
            type="text" 
            placeholder="Type a message..." 
            className={`bg-transparent border-none outline-none flex-1 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />

          <button 
            type="submit"
            disabled={!msg.trim()}
            className={`p-2 rounded-full transition-all ${msg.trim() ? 'bg-pink-600 text-white scale-110 shadow-lg shadow-pink-500/30 hover:bg-pink-500' : 'text-zinc-500'}`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
