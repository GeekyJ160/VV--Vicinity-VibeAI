
import React, { useState, useEffect, useRef } from 'react';
import { VibeUser, Message } from '../types';
import { supabase } from '../supabaseClient';
import { Send, MoreVertical, MapPin, ArrowLeft } from 'lucide-react';

interface ChatScreenProps {
  user: VibeUser | null;
  isDarkMode: boolean;
  onSelectUser?: (user: VibeUser | null) => void;
}

interface Conversation {
  otherUser: VibeUser;
  lastMessage: Message;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ user, isDarkMode, onSelectUser }) => {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    if (!user) {
      fetchConversations();
    } else {
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
    }
  }, [user, currentUser]);

  const fetchConversations = async () => {
    if (!currentUser) return;
    setLoadingConversations(true);

    try {
      // Fetch recent messages involving the current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      // Group by the other user's ID to find the latest message per conversation
      const latestMessagesMap = new Map<string, Message>();
      messagesData.forEach((m: Message) => {
        const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
        if (!latestMessagesMap.has(otherId)) {
          latestMessagesMap.set(otherId, m);
        }
      });

      const otherUserIds = Array.from(latestMessagesMap.keys());

      // Fetch profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds);

      if (profilesError) throw profilesError;

      const convos: Conversation[] = [];
      profilesData?.forEach((profile: any) => {
        const lastMsg = latestMessagesMap.get(profile.id);
        if (lastMsg) {
          convos.push({
            otherUser: profile as VibeUser,
            lastMessage: lastMsg
          });
        }
      });

      // Sort conversations by last message time descending
      convos.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());

      setConversations(convos);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

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
    if (user) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, user]);

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
      <div className="h-full flex flex-col animate-in fade-in duration-500">
        <div className="p-6 pb-2">
          <h2 className={`text-2xl font-black italic tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Messages</h2>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Recent Syncs</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 scrollbar-hide">
          {loadingConversations ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center h-full">
              <div className="text-6xl mb-6 opacity-20">💬</div>
              <h3 className={`text-lg font-black italic mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No messages yet</h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Start a conversation from the Map or Swipe screens to connect with nearby vibes.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.otherUser.id}
                onClick={() => onSelectUser && onSelectUser(conv.otherUser)}
                className={`flex items-center space-x-4 p-4 rounded-3xl cursor-pointer transition-all active:scale-95 border ${
                  isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800' : 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <img src={conv.otherUser.avatar_url || `https://picsum.photos/seed/${conv.otherUser.id}/80/80`} className="w-14 h-14 rounded-full border-2 border-pink-500 object-cover" alt="" />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 ${isDarkMode ? 'border-zinc-900' : 'border-white'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-black text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{conv.otherUser.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter shrink-0 ml-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${
                    conv.lastMessage.sender_id === currentUser?.id 
                      ? (isDarkMode ? 'text-zinc-500' : 'text-slate-400')
                      : (isDarkMode ? 'text-zinc-300 font-medium' : 'text-slate-700 font-medium')
                  }`}>
                    {conv.lastMessage.sender_id === currentUser?.id ? 'You: ' : ''}{conv.lastMessage.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-transparent overflow-hidden">
      <header className={`px-6 py-4 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-white/5 bg-[#1E1B4B]/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onSelectUser && onSelectUser(null)}
            className={`p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <img src={user.avatar_url || `https://picsum.photos/seed/${user.id}/40/40`} className="w-10 h-10 rounded-full border-2 border-pink-500 shadow-sm object-cover" alt="" />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 ${isDarkMode ? 'border-[#0F0F23]' : 'border-white'}`}></div>
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
            Sync established via {user.vibe?.split(' ')[0] || 'shared'} vibe
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
