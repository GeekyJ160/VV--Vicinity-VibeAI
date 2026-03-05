
import React, { useState, useEffect, useRef } from 'react';
import { VibeUser, Message } from '../types';
import { supabase } from '../supabaseClient';
import { Send, ArrowLeft, Phone, Video, MoreVertical, Smile, Image } from 'lucide-react';
import { Avatar, VibeBadge, PulseDot } from '../components/Icons';

interface ChatScreenProps {
  user: VibeUser | null;
  isDarkMode: boolean;
  onSelectUser?: (user: VibeUser | null) => void;
}

interface Conversation {
  otherUser: VibeUser;
  lastMessage: Message;
}

const QUICK_REPLIES = ["Sounds great! 🎉", "When are you free?", "Let's do it!", "What's your vibe rn?", "👋 Hey!"];

const MOCK_CONVOS: Conversation[] = [
  {
    otherUser: { id: 'm1', name: 'Alex Chen', vibe: 'Coffee & Code ☕', avatar_url: 'https://picsum.photos/seed/alex/100/100', profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
    lastMessage: { id: 'msg1', sender_id: 'm1', receiver_id: 'me', content: 'Hey! Want to grab coffee?', created_at: new Date().toISOString() }
  },
  {
    otherUser: { id: 'm2', name: 'Sam Rivera', vibe: 'Live Music 🎸', avatar_url: 'https://picsum.photos/seed/sam/100/100', profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone', lat: 0, lng: 0 },
    lastMessage: { id: 'msg2', sender_id: 'm2', receiver_id: 'me', content: 'Soundcheck at 8, you coming? 🎸', created_at: new Date(Date.now() - 1800000).toISOString() }
  },
];

const ChatScreen: React.FC<ChatScreenProps> = ({ user, isDarkMode, onSelectUser }) => {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (!user) fetchConversations();
    else {
      fetchMessages();
      if (!supabase) return;
      const channel = supabase.channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id},receiver_id=eq.${currentUser.id}` },
          (payload) => setMessages(prev => [...prev, payload.new as Message]))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUser.id},receiver_id=eq.${user.id}` },
          (payload) => setMessages(prev => [...prev, payload.new as Message]))
        .subscribe();

      // Simulate typing indicator
      const t = setInterval(() => {
        setIsTyping(prev => !prev);
      }, 4000);

      return () => { supabase.removeChannel(channel); clearInterval(t); };
    }
  }, [user, currentUser]);

  const fetchConversations = async () => {
    if (!currentUser) { setConversations(MOCK_CONVOS); return; }
    setLoadingConversations(true);
    try {
      if (!supabase) throw new Error('No Supabase');
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error || !messagesData?.length) throw new Error();

      const latestMap = new Map<string, Message>();
      messagesData.forEach((m: Message) => {
        const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
        if (!latestMap.has(otherId)) latestMap.set(otherId, m);
      });

      const otherIds = Array.from(latestMap.keys());
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);
      const profilesMap = new Map<string, VibeUser>();
      profiles?.forEach((p: VibeUser) => profilesMap.set(p.id, p));

      const convos: Conversation[] = [];
      otherIds.forEach(id => {
        const profile = profilesMap.get(id);
        const lastMsg = latestMap.get(id);
        if (profile && lastMsg) convos.push({ otherUser: profile, lastMessage: lastMsg });
      });
      convos.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
      setConversations(convos);
    } catch {
      setConversations(MOCK_CONVOS);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !currentUser || !supabase) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    if (user) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msg.trim() || !user || !currentUser) return;
    const text = msg.trim();
    setMsg('');

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    if (supabase) {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: user.id,
        content: text,
      });
      if (error) console.error('Send error:', error);
    }
  };

  // ─── Conversation List ──────────────────────────────────────
  if (!user) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 pt-3 pb-24">
            {/* Header */}
            <div className="mb-5">
              <h2 className="font-['Syne',sans-serif] text-[20px] font-[800] tracking-tight text-white">
                Messages
              </h2>
              <p className="text-white/35 text-xs mt-0.5 font-medium">Your vibe connections</p>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/25 font-['DM_Sans',sans-serif]"
              />
            </div>

            {loadingConversations ? (
              <div className="flex justify-center pt-10">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#e879f9] border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 text-center">
                <div className="text-5xl mb-5 opacity-20">💬</div>
                <h3 className="font-['Syne',sans-serif] text-[17px] font-[800] text-white mb-2">No matches yet</h3>
                <p className="text-white/35 text-sm max-w-[200px] leading-relaxed">
                  Swipe to find your vibe tribe and start chatting.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => {
                  const timeAgo = Math.round((Date.now() - new Date(conv.lastMessage.created_at).getTime()) / 60000);
                  const timeStr = timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo / 60)}h`;

                  return (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => onSelectUser && onSelectUser(conv.otherUser)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98 text-left hover:bg-white/5"
                      style={{ border: '1px solid transparent' }}
                    >
                      <Avatar name={conv.otherUser.name} src={conv.otherUser.avatar_url} size={50} online />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-['Syne',sans-serif] font-[700] text-white text-[14px]">
                            {conv.otherUser.name}
                          </span>
                          <span className="text-[10px] text-white/25 font-medium">{timeStr}</span>
                        </div>
                        <p className="text-[12px] text-white/40 truncate font-medium">
                          {conv.lastMessage.content}
                        </p>
                        <div className="mt-1">
                          <span className="text-[10px] text-[#e879f9]/60 font-medium">{conv.otherUser.vibe}</span>
                        </div>
                      </div>

                      <div className="text-white/15 shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat View ──────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div
        className="px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,10,30,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={() => onSelectUser && onSelectUser(null)}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all text-white/50 hover:text-white hover:bg-white/8"
        >
          <ArrowLeft size={20} />
        </button>

        <Avatar name={user.name} src={user.avatar_url} size={40} online />

        <div className="flex-1">
          <div className="font-['Syne',sans-serif] font-[700] text-white text-[14px] leading-none">{user.name}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <PulseDot size={6} />
            <span className="text-[10px] text-[#e879f9] font-medium">{user.vibe}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all">
            <Phone size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all">
            <Video size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-2xl vv-gradient-bg flex items-center justify-center mb-4 vv-float">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-['Syne',sans-serif] font-[700] text-white text-[15px] mb-1">
              Say something to {user.name}
            </h3>
            <p className="text-white/30 text-sm">Your vibes are aligned — break the ice!</p>
          </div>
        )}

        {messages.map((m, i) => {
          const isMe = m.sender_id === currentUser?.id;
          const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== m.sender_id);
          const isLast = i === messages.length - 1 || messages[i + 1]?.sender_id !== m.sender_id;

          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar spacer */}
              {!isMe && (
                <div className="w-7 flex-shrink-0 self-end mb-1">
                  {isLast && <img src={user.avatar_url || `https://picsum.photos/seed/${user.id}/40/40`} className="w-7 h-7 rounded-full object-cover" alt="" />}
                </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                <div
                  className="px-4 py-2.5 text-[14px] font-['DM_Sans',sans-serif] leading-snug"
                  style={{
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe
                      ? 'linear-gradient(135deg, #e879f9, #a855f7)'
                      : 'rgba(255,255,255,0.07)',
                    border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    boxShadow: isMe ? '0 2px 12px rgba(232,121,249,0.25)' : 'none',
                  }}
                >
                  {m.content}
                </div>
                {isLast && (
                  <span className="text-[9px] text-white/25 mt-1 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-end">
            <img src={user.avatar_url || `https://picsum.photos/seed/${user.id}/40/40`} className="w-7 h-7 rounded-full object-cover" alt="" />
            <div className="px-4 py-3 rounded-[18px] rounded-bl-sm" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                    style={{ animation: `vv-bounce 1.2s ease-in-out ${i * 0.2}s infinite`, animationTimingFunction: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide shrink-0">
        {QUICK_REPLIES.map(q => (
          <button
            key={q}
            onClick={() => setMsg(q)}
            className="px-3 py-1.5 rounded-full shrink-0 text-[11px] font-[600] active:scale-95 transition-all whitespace-nowrap"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 transition-colors shrink-0">
          <Image size={18} />
        </button>

        <div
          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <input
            ref={inputRef}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Say something..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] font-['DM_Sans',sans-serif] text-white placeholder:text-white/25"
          />
          <button className="text-white/20 hover:text-white/50 transition-colors">
            <Smile size={16} />
          </button>
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!msg.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40 shrink-0"
          style={{
            background: msg.trim() ? 'linear-gradient(135deg, #e879f9, #a855f7)' : 'rgba(255,255,255,0.08)',
            boxShadow: msg.trim() ? '0 4px 14px rgba(232,121,249,0.35)' : 'none',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
