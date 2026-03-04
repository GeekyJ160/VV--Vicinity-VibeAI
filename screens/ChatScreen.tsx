
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

const QUICK_REPLIES = ["Sounds great! 🎉", "When are you free?", "Let's do it!"];

const ChatScreen: React.FC<ChatScreenProps> = ({ user, isDarkMode, onSelectUser }) => {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
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

      if (!supabase) return;
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
    if (!currentUser) {
      // Fallback to mock data if bypassed
      setConversations([
        {
          otherUser: { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', avatar_url: 'https://picsum.photos/seed/alex/100/100', profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
          lastMessage: { id: 'msg1', sender_id: 'm1', receiver_id: 'me', content: 'Hey! Want to grab coffee?', created_at: new Date().toISOString() }
        }
      ]);
      return;
    }
    setLoadingConversations(true);

    try {
      if (!supabase) throw new Error("Supabase not configured");
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

      const profilesMap = new Map<string, VibeUser>();
      profilesData?.forEach((p: VibeUser) => profilesMap.set(p.id, p));

      const convos: Conversation[] = [];
      otherUserIds.forEach(id => {
        const profile = profilesMap.get(id);
        const lastMsg = latestMessagesMap.get(id);
        if (profile && lastMsg) {
          convos.push({ otherUser: profile, lastMessage: lastMsg });
        }
      });

      // Sort conversations by last message time descending
      convos.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());

      setConversations(convos);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      // Fallback to mock data for prototyping
      setConversations([
        {
          otherUser: { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', avatar_url: 'https://picsum.photos/seed/alex/100/100', profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
          lastMessage: { id: 'msg1', sender_id: 'm1', receiver_id: 'me', content: 'Hey! Want to grab coffee?', created_at: new Date().toISOString() }
        }
      ]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !currentUser || !supabase) return;

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

    if (!supabase) return;
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
      <div className="h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto pb-24">
        <div className="p-5 pb-1">
          <div className="font-['Syne',sans-serif] text-[22px] font-[800] tracking-[-0.5px] mb-1">
            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Matches</span>
          </div>
          <div className="text-[12px] font-['DM_Sans',sans-serif] text-white/40 mb-5">
            People who match your vibe
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4">
          {loadingConversations ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#e879f9] border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center h-full">
              <div className="text-6xl mb-6 opacity-20">💬</div>
              <h3 className={`text-lg font-black italic mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No matches yet</h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Keep swiping to find your vibe tribe.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.otherUser.id}
                onClick={() => onSelectUser && onSelectUser(conv.otherUser)}
                className="p-[14px_16px] flex items-center gap-[14px] cursor-pointer bg-white/5 backdrop-blur-[16px] border border-white/10 rounded-[20px]"
              >
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-['Syne',sans-serif] font-[700] text-[16px] text-white shadow-[0_0_16px_rgba(232,121,249,0.4)]"
                    style={{
                      background: `linear-gradient(135deg, #e879f988, #e879f944)`,
                      border: `2px solid #e879f9`
                    }}
                  >
                    {conv.otherUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22c55e] border-[2px] border-[#0d0a1e]" />
                </div>
                <div className="flex-1">
                  <div className="font-['Syne',sans-serif] font-[700] text-white text-[15px]">
                    {conv.otherUser.name}
                  </div>
                  <div className="text-[12px] text-[#e879f9] font-['DM_Sans',sans-serif]">
                    {conv.otherUser.vibe}
                  </div>
                  <div className="text-[11px] text-white/30 font-['DM_Sans',sans-serif] mt-[2px]">
                    {new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="text-white/20 text-[18px]">›</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-transparent overflow-hidden">
      {/* Chat header */}
      <div className="p-[16px_16px_12px] flex items-center gap-[12px] border-b border-white/5 shrink-0">
        <button 
          onClick={() => onSelectUser && onSelectUser(null)}
          className="bg-transparent border-none text-white/50 text-[20px] cursor-pointer"
        >
          ←
        </button>
        <div 
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-['Syne',sans-serif] font-[700] text-[13px] text-white shadow-[0_0_16px_rgba(232,121,249,0.4)]"
          style={{
            background: `linear-gradient(135deg, #e879f988, #e879f944)`,
            border: `2px solid #e879f9`
          }}
        >
          {user.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-['Syne',sans-serif] font-[700] text-white text-[14px]">
            {user.name}
          </div>
          <div className="text-[11px] text-[#e879f9]">
            {user.vibe}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-[16px] flex flex-col gap-[10px] scrollbar-hide">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser?.id;
          return (
            <div 
              key={m.id} 
              className="flex"
              style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
            >
              <div 
                className="max-w-[72%] p-[10px_14px] text-white font-['DM_Sans',sans-serif] text-[14px] leading-[1.5]"
                style={{
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? "linear-gradient(135deg, #e879f9, #a855f7)" : "rgba(255,255,255,0.07)",
                  border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)"
                }}
              >
                {m.content}
                <div 
                  className="text-[9px] text-white/40 mt-1"
                  style={{ textAlign: isMe ? "right" : "left" }}
                >
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="p-[0_12px_8px] flex gap-[8px] overflow-x-auto scrollbar-hide shrink-0">
        {QUICK_REPLIES.map(q => (
          <button 
            key={q} 
            onClick={() => setMsg(q)}
            className="p-[6px_12px] rounded-[20px] shrink-0 bg-white/5 border border-white/10 text-white/70 text-[11px] font-['DM_Sans',sans-serif] cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-[8px_12px_16px] flex gap-[10px] items-center shrink-0">
        <input 
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
          placeholder="Say something..."
          className="flex-1 p-[12px_16px] rounded-[50px] bg-white/5 border border-white/10 text-white text-[14px] font-['DM_Sans',sans-serif] outline-none"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!msg.trim()}
          className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-[#e879f9] to-[#a855f7] border-none text-white text-[18px] cursor-pointer flex items-center justify-center shadow-[0_0_16px_rgba(232,121,249,0.4)] disabled:opacity-50"
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
